/** @jest-environment node */
import type { AdminDeps } from '../_shared/deps';
import { createHandler } from './handler';

const USER_ID = '2f1c3a4e-8b7d-4c6a-9e0f-1a2b3c4d5e6f';

function makeDeps(overrides: Partial<AdminDeps> = {}): AdminDeps {
  return {
    isCallerAdmin: jest.fn().mockResolvedValue(true),
    createUser: jest.fn(),
    setRole: jest.fn(),
    resetPassword: jest.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  };
}

function request(body: unknown, headers: Record<string, string> = { Authorization: 'Bearer t' }): Request {
  return new Request('http://localhost/admin-reset-password', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('admin-reset-password', () => {
  it('rejects callers without an Authorization header', async () => {
    const res = await createHandler(makeDeps())(request({ userId: USER_ID, password: 'secret123' }, {}));
    expect(res.status).toBe(401);
  });

  it('rejects non-admin callers', async () => {
    const deps = makeDeps({ isCallerAdmin: jest.fn().mockResolvedValue(false) });
    const res = await createHandler(deps)(request({ userId: USER_ID, password: 'secret123' }));
    expect(res.status).toBe(403);
    expect(deps.resetPassword).not.toHaveBeenCalled();
  });

  it.each([
    ['bad user id', { userId: 'nope', password: 'secret123' }],
    ['short password', { userId: USER_ID, password: 'short' }],
    ['missing password', { userId: USER_ID }],
  ])('rejects invalid input: %s', async (_name, body) => {
    const res = await createHandler(makeDeps())(request(body));
    expect(res.status).toBe(400);
  });

  it('resets the password', async () => {
    const deps = makeDeps();
    const res = await createHandler(deps)(request({ userId: USER_ID, password: 'secret123' }));
    expect(res.status).toBe(200);
    expect(deps.resetPassword).toHaveBeenCalledWith(USER_ID, 'secret123');
  });

  it('reports an unknown user', async () => {
    const deps = makeDeps({ resetPassword: jest.fn().mockResolvedValue({ ok: false, reason: 'not_found' }) });
    const res = await createHandler(deps)(request({ userId: USER_ID, password: 'secret123' }));
    expect(res.status).toBe(404);
  });

  it('reports a server error', async () => {
    const deps = makeDeps({ resetPassword: jest.fn().mockResolvedValue({ ok: false, reason: 'error' }) });
    const res = await createHandler(deps)(request({ userId: USER_ID, password: 'secret123' }));
    expect(res.status).toBe(500);
  });
});
