import type { AdminDeps } from '../_shared/deps.ts';
import { fail, isValidPassword, json, preflight, readJson } from '../_shared/http.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createHandler(deps: AdminDeps): (req: Request) => Promise<Response> {
  return async (req) => {
    if (req.method === 'OPTIONS') return preflight();
    if (req.method !== 'POST') return fail('invalid_input');

    const authHeader = req.headers.get('Authorization');
    if (authHeader === null) return fail('unauthenticated');
    if (!(await deps.isCallerAdmin(authHeader))) return fail('forbidden');

    const body = await readJson(req);
    if (body === undefined) return fail('invalid_input');
    const { userId, password } = body;
    if (typeof userId !== 'string' || !UUID.test(userId) || !isValidPassword(password)) return fail('invalid_input');

    const result = await deps.resetPassword(userId, password);
    if (!result.ok) return fail(result.reason === 'not_found' ? 'user_not_found' : 'server_error');

    return json({ ok: true });
  };
}
