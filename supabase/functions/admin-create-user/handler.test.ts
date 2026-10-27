/** @jest-environment node */
import type { AdminDeps } from '../_shared/deps';
import { createHandler } from './handler';

function makeDeps(overrides: Partial<AdminDeps> = {}): AdminDeps {
  return {
    isCallerAdmin: jest.fn().mockResolvedValue(true),
    createUser: jest.fn().mockResolvedValue({ ok: true, userId: 'u1' }),
    setRole: jest.fn().mockResolvedValue(true),
    resetPassword: jest.fn(),
    ...overrides,
  };
}

function request(body: unknown, headers: Record<string, string> = { Authorization: 'Bearer t' }): Request {
  return new Request('http://localhost/admin-create-user', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const valid = { email: 'New@Example.com', password: 'secret123', fullName: ' Ann ', role: 'user' };

describe('admin-create-user', () => {
  it('rejects callers without an Authorization header', async () => {
    const res = await createHandler(makeDeps())(request(valid, {}));
    expect(res.status).toBe(401);
  });

  it('rejects non-admin callers', async () => {
    const deps = makeDeps({ isCallerAdmin: jest.fn().mockResolvedValue(false) });
    const res = await createHandler(deps)(request(valid));
    expect(res.status).toBe(403);
    expect(deps.createUser).not.toHaveBeenCalled();
  });

  it.each([
    ['malformed json', '{nope'],
    ['bad email', { ...valid, email: 'nope' }],
    ['short password', { ...valid, password: '1234567' }],
    ['empty name', { ...valid, fullName: '  ' }],
    ['unknown role', { ...valid, role: 'owner' }],
  ])('rejects invalid input: %s', async (_name, body) => {
    const res = await createHandler(makeDeps())(request(body));
    expect(res.status).toBe(400);
  });

  it('creates a user with a normalised email and name', async () => {
    const deps = makeDeps();
    const res = await createHandler(deps)(request(valid));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ userId: 'u1' });
    expect(deps.createUser).toHaveBeenCalledWith({ email: 'new@example.com', password: 'secret123', fullName: 'Ann' });
    expect(deps.setRole).not.toHaveBeenCalled();
  });

  it('sets the admin role when requested', async () => {
    const deps = makeDeps();
    await createHandler(deps)(request({ ...valid, role: 'admin' }));
    expect(deps.setRole).toHaveBeenCalledWith('u1', 'admin');
  });

  it('reports a duplicate email', async () => {
    const deps = makeDeps({ createUser: jest.fn().mockResolvedValue({ ok: false, reason: 'email_exists' }) });
    const res = await createHandler(deps)(request(valid));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'email_exists' });
  });

  it('reports a server error when the role cannot be set', async () => {
    const deps = makeDeps({ setRole: jest.fn().mockResolvedValue(false) });
    const res = await createHandler(deps)(request({ ...valid, role: 'admin' }));
    expect(res.status).toBe(500);
  });

  it('answers preflight requests', async () => {
    const res = await createHandler(makeDeps())(new Request('http://localhost/x', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('rejects other methods', async () => {
    const res = await createHandler(makeDeps())(new Request('http://localhost/x', { method: 'GET' }));
    expect(res.status).toBe(400);
  });
});
