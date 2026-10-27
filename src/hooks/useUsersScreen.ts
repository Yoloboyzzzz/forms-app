import { useEffect, useState } from 'react';
import { toServiceError } from '@/services/errors';
import { useAuthStore } from '@/state/useAuthStore';
import { useUsersStore } from '@/state/useUsersStore';
import type { Profile } from '@/types/models';
import { useClipboard } from './useClipboard';
import { useGeneratePassword } from './useGeneratePassword';

export type PendingUserAction =
  | { kind: 'reset'; user: Profile }
  | { kind: 'role'; user: Profile; role: Profile['role'] };

interface UseUsersScreen {
  users: Profile[];
  currentUserId?: string;
  isLoading: boolean;
  isLoaded: boolean;
  errorKey?: string;
  reload: () => void;
  /** The action waiting for the admin's confirmation. */
  pending?: PendingUserAction;
  requestReset: (user: Profile) => void;
  requestRoleChange: (user: Profile) => void;
  cancelPending: () => void;
  confirmPending: () => Promise<void>;
  isWorking: boolean;
  /** i18n key when confirming failed. */
  actionErrorKey?: string;
  /** The generated password to hand over after a reset. */
  issuedPassword?: { userName: string; password: string };
  copyPassword: () => void;
  passwordCopied: boolean;
  dismissPassword: () => void;
}

/** Glue for the admin users list: loading, reset-password and role-change flows with confirmation. */
export function useUsersScreen(): UseUsersScreen {
  const users = useUsersStore((state) => state.users);
  const isLoading = useUsersStore((state) => state.isLoading);
  const isLoaded = useUsersStore((state) => state.isLoaded);
  const errorKey = useUsersStore((state) => state.errorKey);
  const load = useUsersStore((state) => state.load);
  const resetPassword = useUsersStore((state) => state.resetPassword);
  const setRole = useUsersStore((state) => state.setRole);
  const currentUserId = useAuthStore((state) => state.session?.userId);
  const generatePassword = useGeneratePassword();
  const clipboard = useClipboard();

  const [pending, setPending] = useState<PendingUserAction | undefined>(undefined);
  const [isWorking, setIsWorking] = useState(false);
  const [actionErrorKey, setActionErrorKey] = useState<string | undefined>(undefined);
  const [issuedPassword, setIssuedPassword] = useState<{ userName: string; password: string } | undefined>(undefined);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmPending(): Promise<void> {
    if (pending === undefined) return;
    setIsWorking(true);
    setActionErrorKey(undefined);
    try {
      if (pending.kind === 'reset') {
        const password = generatePassword();
        await resetPassword(pending.user.id, password);
        setIssuedPassword({ userName: pending.user.fullName || pending.user.email, password });
        await load();
      } else {
        await setRole(pending.user.id, pending.role);
      }
      setPending(undefined);
    } catch (error) {
      setActionErrorKey(toServiceError(error).messageKey);
    } finally {
      setIsWorking(false);
    }
  }

  return {
    users,
    currentUserId,
    isLoading,
    isLoaded,
    errorKey,
    reload: () => void load(),
    pending,
    requestReset: (user) => {
      setActionErrorKey(undefined);
      setPending({ kind: 'reset', user });
    },
    requestRoleChange: (user) => {
      setActionErrorKey(undefined);
      setPending({ kind: 'role', user, role: user.role === 'admin' ? 'user' : 'admin' });
    },
    cancelPending: () => setPending(undefined),
    confirmPending,
    isWorking,
    actionErrorKey,
    issuedPassword,
    copyPassword: () => {
      if (issuedPassword !== undefined) void clipboard.copy(issuedPassword.password);
    },
    passwordCopied: clipboard.copied,
    dismissPassword: () => {
      setIssuedPassword(undefined);
      clipboard.reset();
    },
  };
}
