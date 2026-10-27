import { useState } from 'react';
import { requestPasswordReset, resetPasswordWithCode } from '@/services/authService';
import { toServiceError } from '@/services/errors';

export type ForgotPasswordStep = 'email' | 'code';

interface UseForgotPassword {
  step: ForgotPasswordStep;
  /** The address the code was sent to. */
  email: string;
  isLoading: boolean;
  /** i18n key of the last failure; cleared on the next attempt. */
  errorKey?: string;
  requestCode: (email: string) => Promise<void>;
  resendCode: () => Promise<void>;
  /** On success the user is signed in; the route guards then move them on. */
  resetPassword: (code: string, newPassword: string) => Promise<void>;
}

/** Page-local flow for "forgot password": ask for a code, then set a new password with it. */
export function useForgotPassword(): UseForgotPassword {
  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | undefined>(undefined);

  async function run(action: () => Promise<void>): Promise<void> {
    setErrorKey(undefined);
    setIsLoading(true);
    try {
      await action();
    } catch (error) {
      setErrorKey(toServiceError(error).messageKey);
    } finally {
      setIsLoading(false);
    }
  }

  async function requestCode(address: string): Promise<void> {
    await run(async () => {
      await requestPasswordReset(address);
      setEmail(address.trim());
      setStep('code');
    });
  }

  return {
    step,
    email,
    isLoading,
    errorKey,
    requestCode,
    resendCode: () => run(() => requestPasswordReset(email)),
    resetPassword: (code, newPassword) => run(() => resetPasswordWithCode(email, code, newPassword)),
  };
}
