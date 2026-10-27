import type { User } from '../types/User';

export async function login(_email: string, _password: string): Promise<User> {
  throw new Error('Not yet implemented — connect your Supabase auth here');
}

export async function logout(): Promise<void> {
  throw new Error('Not yet implemented — connect your Supabase auth here');
}
