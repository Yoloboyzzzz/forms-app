import type { Profile } from '../types/models';
import { ServiceError, throwIfError } from './errors';
import { toProfile } from './mappers/recordMappers';
import { supabase } from './supabase/client';

/**
 * Loads the profile (role, name, mustChangePassword) of a user. Readable even while the
 * first-time password is still active, so the app can force the password change.
 * @throws ServiceError `notFound` when the user has no profile row.
 */
export async function getMyProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  throwIfError(error);
  if (data === null) {
    throw new ServiceError('notFound');
  }
  return toProfile(data);
}

/** Updates the display name; the database allows users to change nothing else on their profile. */
export async function updateMyName(userId: string, fullName: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim() })
    .eq('id', userId)
    .select('*')
    .single();
  throwIfError(error);
  if (data === null) {
    throw new ServiceError('unknown');
  }
  return toProfile(data);
}
