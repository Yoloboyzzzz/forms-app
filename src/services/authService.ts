import type { Session } from '@supabase/supabase-js';
import type { AuthSession } from '../types/models';
import type { User } from '../types/User';
import { ServiceError, throwIfError, toServiceError } from './errors';
import { supabase } from './supabase/client';

function toAuthSession(session: Session | null): AuthSession | undefined {
  if (session === null) {
    return undefined;
  }
  return { userId: session.user.id, email: session.user.email ?? '' };
}

// Starter placeholders; replaced by the Supabase-backed store in step 2.2.
export async function login(_email: string, _password: string): Promise<User> {
  throw new Error('Not yet implemented — connect your Supabase auth here');
}

export async function logout(): Promise<void> {
  throw new Error('Not yet implemented — connect your Supabase auth here');
}

/**
 * Signs in with email and password.
 * @throws ServiceError `invalidCredentials`, `rateLimited` or `network`.
 */
export async function signIn(email: string, password: string): Promise<AuthSession> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  throwIfError(error);
  const session = toAuthSession(data.session);
  if (session === undefined) {
    throw new ServiceError('unknown');
  }
  return session;
}

/** Ends the session on this device. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  throwIfError(error);
}

/**
 * Sets a new password for the signed-in user. The database clears `must_change_password` itself.
 * @throws ServiceError `weakPassword` or `samePassword`.
 */
export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  throwIfError(error);
}

/**
 * Sends a recovery email with a 6-digit code. Succeeds for unknown addresses too, so the
 * screen cannot be used to find out which emails have an account.
 * @throws ServiceError `rateLimited` or `network`.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error === null) {
    return;
  }
  const serviceError = toServiceError(error);
  if (serviceError.code === 'rateLimited' || serviceError.code === 'network') {
    throw serviceError;
  }
}

/**
 * Verifies the emailed code and sets the new password. The user is signed in afterwards.
 * @throws ServiceError `invalidCode`, `weakPassword`, `samePassword` or `rateLimited`.
 */
export async function resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<void> {
  const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
  if (verifyError !== null) {
    const serviceError = toServiceError(verifyError);
    // Supabase answers a wrong or expired code with a generic 4xx; show it as an invalid code.
    throw serviceError.code === 'unknown' ? new ServiceError('invalidCode', verifyError) : serviceError;
  }
  await changePassword(newPassword);
}

/** The restored session, or undefined when signed out. */
export async function getSession(): Promise<AuthSession | undefined> {
  const { data, error } = await supabase.auth.getSession();
  throwIfError(error);
  return toAuthSession(data.session);
}

/**
 * Subscribes to sign-in, sign-out and token refresh.
 * The callback must not await other Supabase calls inline (supabase-js deadlocks); defer them instead.
 * @returns a function that removes the subscription.
 */
export function onAuthStateChange(callback: (session: AuthSession | undefined) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(toAuthSession(session));
  });
  return () => data.subscription.unsubscribe();
}
