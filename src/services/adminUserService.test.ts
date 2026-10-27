import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import { createUser, listUsers, resetPassword, setUserRole } from './adminUserService';
import { ServiceError } from './errors';

const mockFrom = jest.fn();
const mockInvoke = jest.fn();
const mockRpc = jest.fn();

// Resolved lazily: the factory runs when the service is imported, before the consts above are initialised.
jest.mock('@/services/supabase/client', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
    functions: { invoke: (name: string, options: unknown) => mockInvoke(name, options) },
    rpc: (name: string, args: unknown) => mockRpc(name, args),
  },
}));

const TS = '2026-10-27T10:00:00Z';
const row = (id: string, name: string) => ({
  id,
  email: `${name}@b.c`,
  full_name: name,
  role: 'user',
  must_change_password: true,
  created_at: TS,
  updated_at: TS,
});

function httpError(status: number, body: unknown): FunctionsHttpError {
  return new FunctionsHttpError({ status, json: async () => body });
}

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof ServiceError ? error.code : 'not-a-service-error';
  }
}

const input = { fullName: 'Ann', email: 'ann@b.c', role: 'user', password: 'first-time-1' } as const;

beforeEach(() => jest.resetAllMocks());

describe('listUsers', () => {
  it('returns profiles sorted by name', async () => {
    const order = jest.fn().mockResolvedValue({ data: [row('u1', 'Ann'), row('u2', 'Bob')], error: null });
    const select = jest.fn().mockReturnValue({ order });
    mockFrom.mockReturnValue({ select });

    const users = await listUsers();

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(order).toHaveBeenCalledWith('full_name', { ascending: true });
    expect(users.map((user) => user.fullName)).toEqual(['Ann', 'Bob']);
  });

  it('maps database errors', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } });
    mockFrom.mockReturnValue({ select: () => ({ order }) });
    expect(await codeOf(listUsers())).toBe('forbidden');
  });
});

describe('createUser', () => {
  it('calls the edge function and returns the new user id', async () => {
    mockInvoke.mockResolvedValue({ data: { userId: 'u9' }, error: null });

    await expect(createUser(input)).resolves.toBe('u9');

    expect(mockInvoke).toHaveBeenCalledWith('admin-create-user', { body: input });
  });

  it('reports an email that is already used', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: httpError(409, { error: 'email_exists' }) });
    expect(await codeOf(createUser(input))).toBe('duplicate');
  });

  it('reports invalid input', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: httpError(400, { error: 'invalid_input' }) });
    expect(await codeOf(createUser(input))).toBe('invalidInput');
  });

  it.each(['forbidden', 'unauthenticated'])('treats %s as forbidden', async (code) => {
    mockInvoke.mockResolvedValue({ data: null, error: httpError(403, { error: code }) });
    expect(await codeOf(createUser(input))).toBe('forbidden');
  });

  it('maps server errors to unknown', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: httpError(500, { error: 'server_error' }) });
    expect(await codeOf(createUser(input))).toBe('unknown');
  });

  it('falls back to the status when the body is not JSON', async () => {
    const error = new FunctionsHttpError({
      status: 403,
      json: async () => {
        throw new SyntaxError('not json');
      },
    });
    mockInvoke.mockResolvedValue({ data: null, error });
    expect(await codeOf(createUser(input))).toBe('unknown');
  });

  it('falls back when the body has no error code', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: httpError(500, 'oops') });
    expect(await codeOf(createUser(input))).toBe('unknown');
  });

  it('reports a network failure', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new FunctionsFetchError(new TypeError('Failed to fetch')) });
    expect(await codeOf(createUser(input))).toBe('network');
  });

  it('fails when the response has no user id', async () => {
    mockInvoke.mockResolvedValue({ data: {}, error: null });
    expect(await codeOf(createUser(input))).toBe('unknown');
    mockInvoke.mockResolvedValue({ data: 'x', error: null });
    expect(await codeOf(createUser(input))).toBe('unknown');
  });
});

describe('resetPassword', () => {
  it('calls the edge function', async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });

    await resetPassword('u1', 'first-time-2');

    expect(mockInvoke).toHaveBeenCalledWith('admin-reset-password', { body: { userId: 'u1', password: 'first-time-2' } });
  });

  it('reports an unknown user', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: httpError(404, { error: 'user_not_found' }) });
    expect(await codeOf(resetPassword('u1', 'first-time-2'))).toBe('notFound');
  });
});

describe('setUserRole', () => {
  it('calls the set_user_role function', async () => {
    mockRpc.mockResolvedValue({ error: null });

    await setUserRole('u1', 'admin');

    expect(mockRpc).toHaveBeenCalledWith('set_user_role', { target_user: 'u1', new_role: 'admin' });
  });

  it('reports a refused change', async () => {
    mockRpc.mockResolvedValue({ error: { code: '42501', message: 'Only admins can change roles' } });
    expect(await codeOf(setUserRole('u1', 'admin'))).toBe('forbidden');
  });
});
