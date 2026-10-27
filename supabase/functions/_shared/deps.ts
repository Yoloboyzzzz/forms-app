import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';

/** What the handlers need from Supabase; injected so tests can fake it. */
export interface AdminDeps {
  /** True when the caller (identified by their own JWT) is an admin who already replaced the first-time password. */
  isCallerAdmin(authHeader: string): Promise<boolean>;
  createUser(input: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<{ ok: true; userId: string } | { ok: false; reason: 'email_exists' | 'error' }>;
  setRole(userId: string, role: 'user' | 'admin'): Promise<boolean>;
  /** Sets a new password and turns must_change_password back on. */
  resetPassword(userId: string, password: string): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'error' }>;
}

export function createSupabaseDeps(): AdminDeps {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  return {
    async isCallerAdmin(authHeader) {
      const caller = createClient(url, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await caller.rpc('is_admin');
      return error === null && data === true;
    },

    async createUser({ email, password, fullName }) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error !== null || data.user === null) {
        return { ok: false, reason: error?.code === 'email_exists' ? 'email_exists' : 'error' };
      }
      return { ok: true, userId: data.user.id };
    },

    async setRole(userId, role) {
      const { error } = await admin.from('profiles').update({ role }).eq('id', userId);
      return error === null;
    },

    async resetPassword(userId, password) {
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error !== null) {
        return { ok: false, reason: error.status === 404 || error.code === 'user_not_found' ? 'not_found' : 'error' };
      }
      // The password-change trigger just cleared the flag; force a new change at next login.
      const { error: flagError } = await admin.from('profiles').update({ must_change_password: true }).eq('id', userId);
      return flagError === null ? { ok: true } : { ok: false, reason: 'error' };
    },
  };
}
