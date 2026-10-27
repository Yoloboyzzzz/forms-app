import { useState } from 'react';
import { toServiceError } from '@/services/errors';
import { useAuthStore } from '@/state/useAuthStore';

interface UseLogin {
  signIn: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  /** i18n key of the last failure; cleared on the next attempt. */
  errorKey?: string;
}

/** Signs in through the auth store and exposes the failure as an i18n key. */
export function useLogin(): UseLogin {
  const signInStore = useAuthStore((state) => state.signIn);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [errorKey, setErrorKey] = useState<string | undefined>(undefined);

  async function signIn(email: string, password: string): Promise<void> {
    setErrorKey(undefined);
    try {
      await signInStore(email, password);
    } catch (error) {
      setErrorKey(toServiceError(error).messageKey);
    }
  }

  return { signIn, isLoading, errorKey };
}
