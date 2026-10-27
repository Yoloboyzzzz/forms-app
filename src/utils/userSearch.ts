import type { Profile } from '@/types/models';

/** Users whose name or email contains the query (ignoring case and surrounding spaces). Empty query keeps everyone. */
export function filterUsers(users: readonly Profile[], query: string): Profile[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return [...users];
  }
  return users.filter((user) => user.fullName.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle));
}
