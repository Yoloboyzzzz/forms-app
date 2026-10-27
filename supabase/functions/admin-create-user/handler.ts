import type { AdminDeps } from '../_shared/deps.ts';
import { fail, isEmail, isValidPassword, json, preflight, readJson } from '../_shared/http.ts';

export function createHandler(deps: AdminDeps): (req: Request) => Promise<Response> {
  return async (req) => {
    if (req.method === 'OPTIONS') return preflight();
    if (req.method !== 'POST') return fail('invalid_input');

    const authHeader = req.headers.get('Authorization');
    if (authHeader === null) return fail('unauthenticated');
    if (!(await deps.isCallerAdmin(authHeader))) return fail('forbidden');

    const body = await readJson(req);
    if (body === undefined) return fail('invalid_input');
    const { email, password, fullName, role } = body;
    if (!isEmail(email) || !isValidPassword(password)) return fail('invalid_input');
    if (typeof fullName !== 'string' || fullName.trim() === '' || fullName.length > 200) return fail('invalid_input');
    if (role !== 'user' && role !== 'admin') return fail('invalid_input');

    const created = await deps.createUser({ email: email.toLowerCase(), password, fullName: fullName.trim() });
    if (!created.ok) return fail(created.reason === 'email_exists' ? 'email_exists' : 'server_error');

    if (role === 'admin' && !(await deps.setRole(created.userId, 'admin'))) return fail('server_error');

    return json({ userId: created.userId }, 201);
  };
}
