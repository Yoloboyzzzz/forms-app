import { ServiceError } from './errors';
import { getMyProfile, updateMyName } from './profileService';

const mockFrom = jest.fn();

// Resolved lazily: the factory runs when the service is imported, before the const above is initialised.
jest.mock('@/services/supabase/client', () => ({ supabase: { from: (table: string) => mockFrom(table) } }));

const TS = '2026-10-27T10:00:00Z';
const row = {
  id: 'u1',
  email: 'a@b.c',
  full_name: 'Ann',
  role: 'admin',
  must_change_password: true,
  created_at: TS,
  updated_at: TS,
};

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof ServiceError ? error.code : 'not-a-service-error';
  }
}

beforeEach(() => jest.resetAllMocks());

describe('getMyProfile', () => {
  it('maps the profile row', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: row, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq }) });

    const profile = await getMyProfile('u1');

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(eq).toHaveBeenCalledWith('id', 'u1');
    expect(profile).toMatchObject({ id: 'u1', fullName: 'Ann', role: 'admin', mustChangePassword: true });
  });

  it('reports a missing profile', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle }) }) });
    expect(await codeOf(getMyProfile('u1'))).toBe('notFound');
  });

  it('maps database errors', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } });
    mockFrom.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle }) }) });
    expect(await codeOf(getMyProfile('u1'))).toBe('forbidden');
  });
});

describe('updateMyName', () => {
  it('updates only the trimmed name and returns the profile', async () => {
    const single = jest.fn().mockResolvedValue({ data: { ...row, full_name: 'Bob' }, error: null });
    const update = jest.fn().mockReturnValue({ eq: () => ({ select: () => ({ single }) }) });
    mockFrom.mockReturnValue({ update });

    const profile = await updateMyName('u1', '  Bob ');

    expect(update).toHaveBeenCalledWith({ full_name: 'Bob' });
    expect(profile.fullName).toBe('Bob');
  });

  it('maps database errors', async () => {
    const single = jest.fn().mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });
    mockFrom.mockReturnValue({ update: () => ({ eq: () => ({ select: () => ({ single }) }) }) });
    expect(await codeOf(updateMyName('u1', 'Bob'))).toBe('network');
  });
});
