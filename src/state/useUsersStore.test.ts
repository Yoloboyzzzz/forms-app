import {
  createUser,
  listUsers,
  resetPassword,
  setUserRole,
} from '@/services/adminUserService';
import { ServiceError } from '@/services/errors';
import type { Profile } from '@/types/models';
import { resetAllStores } from './storeRegistry';
import { useUsersStore } from './useUsersStore';

jest.mock('@/services/adminUserService', () => ({
  createUser: jest.fn(),
  listUsers: jest.fn(),
  resetPassword: jest.fn(),
  setUserRole: jest.fn(),
}));

function profile(id: string, role: Profile['role'] = 'user'): Profile {
  return {
    id,
    email: `${id}@b.c`,
    fullName: id,
    role,
    mustChangePassword: true,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  useUsersStore.getState().resetAll();
});

describe('load', () => {
  it('stores the users', async () => {
    jest.mocked(listUsers).mockResolvedValue([profile('u1'), profile('u2')]);

    const promise = useUsersStore.getState().load();
    expect(useUsersStore.getState().isLoading).toBe(true);
    await promise;

    expect(useUsersStore.getState()).toMatchObject({ isLoaded: true, isLoading: false, errorKey: undefined });
    expect(useUsersStore.getState().users).toHaveLength(2);
  });

  it('keeps the error key and stays not loaded when it fails', async () => {
    jest.mocked(listUsers).mockRejectedValue(new ServiceError('network'));

    await useUsersStore.getState().load();

    expect(useUsersStore.getState()).toMatchObject({ isLoaded: false, isLoading: false, errorKey: 'errors.network' });
  });

  it('clears the previous error on retry', async () => {
    jest.mocked(listUsers).mockRejectedValueOnce(new ServiceError('network')).mockResolvedValueOnce([profile('u1')]);

    await useUsersStore.getState().load();
    await useUsersStore.getState().load();

    expect(useUsersStore.getState()).toMatchObject({ errorKey: undefined, isLoaded: true });
  });
});

describe('createUser', () => {
  const input = { fullName: 'New', email: 'n@b.c', role: 'user', password: 'first-time-1' } as const;

  it('creates the user and refreshes the list', async () => {
    jest.mocked(createUser).mockResolvedValue('u9');
    jest.mocked(listUsers).mockResolvedValue([profile('u9')]);

    await expect(useUsersStore.getState().createUser(input)).resolves.toBe('u9');

    expect(createUser).toHaveBeenCalledWith(input);
    expect(useUsersStore.getState().users.map((user) => user.id)).toEqual(['u9']);
  });

  it('rethrows service errors without reloading', async () => {
    jest.mocked(createUser).mockRejectedValue(new ServiceError('duplicate'));

    await expect(useUsersStore.getState().createUser(input)).rejects.toMatchObject({ code: 'duplicate' });

    expect(listUsers).not.toHaveBeenCalled();
  });
});

describe('resetPassword', () => {
  it('delegates to the service', async () => {
    jest.mocked(resetPassword).mockResolvedValue(undefined);

    await useUsersStore.getState().resetPassword('u1', 'first-time-2');

    expect(resetPassword).toHaveBeenCalledWith('u1', 'first-time-2');
  });
});

describe('setRole', () => {
  it('changes the role and refreshes the list', async () => {
    jest.mocked(setUserRole).mockResolvedValue(undefined);
    jest.mocked(listUsers).mockResolvedValue([profile('u1', 'admin')]);

    await useUsersStore.getState().setRole('u1', 'admin');

    expect(setUserRole).toHaveBeenCalledWith('u1', 'admin');
    expect(useUsersStore.getState().users[0].role).toBe('admin');
  });

  it('rethrows a refused change', async () => {
    jest.mocked(setUserRole).mockRejectedValue(new ServiceError('forbidden'));

    await expect(useUsersStore.getState().setRole('u1', 'admin')).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('logout', () => {
  it('is cleared with all stores', async () => {
    jest.mocked(listUsers).mockResolvedValue([profile('u1')]);
    await useUsersStore.getState().load();

    resetAllStores();

    expect(useUsersStore.getState()).toMatchObject({ users: [], isLoaded: false });
  });
});
