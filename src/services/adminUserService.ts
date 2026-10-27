import { FunctionsHttpError } from '@supabase/supabase-js';
import type { UserRole } from '../types/enums';
import type { Profile } from '../types/models';
import { ServiceError, throwIfError, toServiceError } from './errors';
import { isRecord, readString } from './mappers/json';
import { toProfile } from './mappers/recordMappers';
import { supabase } from './supabase/client';

export interface NewUserInput {
  fullName: string;
  email: string;
  role: UserRole;
  /** The first-time password; the user must change it at first login. */
  password: string;
}

/** Turns the Edge Functions' `{ error: code }` response into a ServiceError. */
async function toFunctionError(error: unknown): Promise<ServiceError> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body: unknown = await error.context.json();
      const code = isRecord(body) ? readString(body, 'error') : undefined;
      if (code !== undefined) {
        // 'unauthenticated' and 'forbidden' both mean the caller may not do this.
        return toServiceError({ code: code === 'unauthenticated' ? 'forbidden' : code, status: error.context.status });
      }
    } catch {
      // The body was not JSON; fall through to the generic mapping.
    }
  }
  return toServiceError(error);
}

/** All accounts, sorted by name. Admin only (RLS). */
export async function listUsers(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
  throwIfError(error);
  return (data ?? []).map(toProfile);
}

/**
 * Creates an account with a first-time password through the `admin-create-user` Edge Function.
 * @returns the id of the new user.
 * @throws ServiceError `duplicate` (email taken), `invalidInput`, `forbidden` or `network`.
 */
export async function createUser(input: NewUserInput): Promise<string> {
  const { data, error } = await supabase.functions.invoke('admin-create-user', { body: input });
  if (error !== null) {
    throw await toFunctionError(error);
  }
  const userId = isRecord(data) ? readString(data, 'userId') : undefined;
  if (userId === undefined) {
    throw new ServiceError('unknown');
  }
  return userId;
}

/**
 * Sets a new first-time password; the user has to change it at the next login.
 * @throws ServiceError `notFound`, `invalidInput`, `forbidden` or `network`.
 */
export async function resetPassword(userId: string, password: string): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-reset-password', { body: { userId, password } });
  if (error !== null) {
    throw await toFunctionError(error);
  }
}

/** Changes a role through the `set_user_role` function (the database refuses non-admins). */
export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase.rpc('set_user_role', { target_user: userId, new_role: role });
  throwIfError(error);
}
