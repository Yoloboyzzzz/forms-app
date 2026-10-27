import { useState } from 'react';
import type { NewUserInput } from '@/services/adminUserService';
import { toServiceError } from '@/services/errors';
import { useUsersStore } from '@/state/useUsersStore';
import { useClipboard } from './useClipboard';
import { useGeneratePassword } from './useGeneratePassword';

interface UseCreateUser {
  createUser: (input: NewUserInput) => Promise<void>;
  isLoading: boolean;
  /** i18n key of the last failure; cleared on the next attempt. */
  errorKey?: string;
  /** Set after success: shown once so the admin can hand the password over. */
  created?: { userName: string; password: string };
  generatePassword: () => string;
  copyPassword: (password: string) => void;
  copied: boolean;
  dismissCreated: () => void;
}

/** Glue for the "new user" screen. */
export function useCreateUser(): UseCreateUser {
  const createUserStore = useUsersStore((state) => state.createUser);
  const generatePassword = useGeneratePassword();
  const clipboard = useClipboard();
  const [isLoading, setIsLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | undefined>(undefined);
  const [created, setCreated] = useState<{ userName: string; password: string } | undefined>(undefined);

  async function createUser(input: NewUserInput): Promise<void> {
    setErrorKey(undefined);
    setIsLoading(true);
    try {
      await createUserStore(input);
      setCreated({ userName: input.fullName, password: input.password });
    } catch (error) {
      setErrorKey(toServiceError(error).messageKey);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    createUser,
    isLoading,
    errorKey,
    created,
    generatePassword,
    copyPassword: (password) => void clipboard.copy(password),
    copied: clipboard.copied,
    dismissCreated: () => {
      setCreated(undefined);
      clipboard.reset();
    },
  };
}
