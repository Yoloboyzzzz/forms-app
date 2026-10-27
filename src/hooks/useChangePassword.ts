import { useState } from 'react';
import { toServiceError } from '@/services/errors';
import { useAuthStore } from '@/state/useAuthStore';

interface UseChangePassword {
  /** @returns true when the password was changed. */
  changePassword: (newPassword: string) => Promise<boolean>;
  isLoading: boolean;
  /** i18n key of the last failure; cleared on the next attempt. */
  errorKey?: string;
}

/** Changes the signed-in user's password through the auth store (forced first-login change and Profile). */
export function useChangePassword(): UseChangePassword {
  const changePasswordStore = useAuthStore((state) => state.changePassword);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [errorKey, setErrorKey] = useState<string | undefined>(undefined);

  async function changePassword(newPassword: string): Promise<boolean> {
    setErrorKey(undefined);
    try {
      await changePasswordStore(newPassword);
      return true;
    } catch (error) {
      setErrorKey(toServiceError(error).messageKey);
      return false;
    }
  }

  return { changePassword, isLoading, errorKey };
}
