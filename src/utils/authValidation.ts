import { MIN_PASSWORD_LENGTH } from '@/constants/auth';

/** Validators return an i18n key for the problem, or undefined when the value is fine. */
export type ValidationKey = string | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): ValidationKey {
  const trimmed = email.trim();
  if (trimmed === '') return 'validation.required';
  return EMAIL_PATTERN.test(trimmed) ? undefined : 'validation.emailInvalid';
}

export function validateRequired(value: string): ValidationKey {
  return value.trim() === '' ? 'validation.required' : undefined;
}

export function validateNewPassword(password: string): ValidationKey {
  if (password === '') return 'validation.required';
  return password.length >= MIN_PASSWORD_LENGTH ? undefined : 'validation.passwordTooShort';
}

export function validatePasswordConfirmation(password: string, confirmation: string): ValidationKey {
  if (confirmation === '') return 'validation.required';
  return password === confirmation ? undefined : 'validation.passwordsDoNotMatch';
}

/** A 6-digit recovery code, as emailed by Supabase. */
export function validateRecoveryCode(code: string): ValidationKey {
  const trimmed = code.trim();
  if (trimmed === '') return 'validation.required';
  return /^\d{6}$/.test(trimmed) ? undefined : 'validation.codeInvalid';
}
