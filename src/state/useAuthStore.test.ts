import {
  changePassword,
  getSession,
  onAuthStateChange,
  signIn,
  signOut,
} from '@/services/authService';
import { ServiceError } from '@/services/errors';
import { getMyProfile, updateMyName } from '@/services/profileService';
import type { Profile } from '@/types/models';
import { registerStoreReset } from './storeRegistry';
import { useAuthStore } from './useAuthStore';

jest.mock('@/services/authService', () => ({
  changePassword: jest.fn(),
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock('@/services/profileService', () => ({
  getMyProfile: jest.fn(),
  updateMyName: jest.fn(),
}));

const session = { userId: 'u1', email: 'a@b.c' };
const profile: Profile = {
  id: 'u1',
  email: 'a@b.c',
  fullName: 'Ann',
  role: 'user',
  mustChangePassword: false,
  createdAt: new Date('2026-10-27T10:00:00Z'),
  updatedAt: new Date('2026-10-27T10:00:00Z'),
};

type Listener = (session: { userId: string; email: string } | undefined) => void;
let listener: Listener | undefined;
const unsubscribe = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
  useAuthStore.getState().resetAll();
  useAuthStore.setState({ isBootstrapped: false });
  listener = undefined;
  jest.mocked(onAuthStateChange).mockImplementation((callback) => {
    listener = callback;
    return unsubscribe;
  });
});

describe('bootstrap', () => {
  it('finishes without a session', async () => {
    jest.mocked(getSession).mockResolvedValue(undefined);

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState()).toMatchObject({ isBootstrapped: true, session: undefined, profile: undefined });
  });

  it('restores the session and loads the profile', async () => {
    jest.mocked(getSession).mockResolvedValue(session);
    jest.mocked(getMyProfile).mockResolvedValue(profile);

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState()).toMatchObject({ isBootstrapped: true, session, profile });
  });

  it('still finishes when restoring fails, and keeps the error key', async () => {
    jest.mocked(getSession).mockResolvedValue(session);
    jest.mocked(getMyProfile).mockRejectedValue({ message: 'Failed to fetch' });

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState()).toMatchObject({ isBootstrapped: true, bootstrapError: 'errors.network' });
  });

  it('returns the cleanup function', async () => {
    jest.mocked(getSession).mockResolvedValue(undefined);

    const cleanup = await useAuthStore.getState().bootstrap();
    cleanup();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  describe('auth listener', () => {
    beforeEach(async () => {
      jest.mocked(getSession).mockResolvedValue(session);
      jest.mocked(getMyProfile).mockResolvedValue(profile);
      await useAuthStore.getState().bootstrap();
    });

    it('clears the stores when the session ends', () => {
      listener?.(undefined);

      expect(useAuthStore.getState()).toMatchObject({ session: undefined, profile: undefined });
    });

    it('ignores sign-out events when nobody is signed in', () => {
      useAuthStore.getState().resetAll();
      const before = useAuthStore.getState();

      listener?.(undefined);

      expect(useAuthStore.getState()).toBe(before);
    });

    it('ignores token refreshes of the same user', () => {
      jest.mocked(getMyProfile).mockClear();

      listener?.(session);

      expect(getMyProfile).not.toHaveBeenCalled();
    });

    it('loads the profile of a different user after the listener returns', async () => {
      jest.useFakeTimers();
      const other = { userId: 'u2', email: 'x@y.z' };
      jest.mocked(getMyProfile).mockResolvedValue({ ...profile, id: 'u2' });

      listener?.(other);
      expect(useAuthStore.getState().session).toEqual(other);
      expect(getMyProfile).toHaveBeenCalledTimes(1);

      await jest.runAllTimersAsync();
      expect(getMyProfile).toHaveBeenCalledTimes(2);
      expect(useAuthStore.getState().profile?.id).toBe('u2');
      jest.useRealTimers();
    });

    it('reports a failing profile load', async () => {
      jest.useFakeTimers();
      jest.mocked(getMyProfile).mockRejectedValue(new Error('boom'));

      listener?.({ userId: 'u3', email: 'q@w.e' });
      await jest.runAllTimersAsync();

      expect(useAuthStore.getState().bootstrapError).toBe('errors.unknown');
      jest.useRealTimers();
    });
  });
});

describe('signIn', () => {
  it('stores the session and profile and clears the loading flag', async () => {
    jest.mocked(signIn).mockResolvedValue(session);
    jest.mocked(getMyProfile).mockResolvedValue(profile);

    const promise = useAuthStore.getState().signIn('a@b.c', 'secret123');
    expect(useAuthStore.getState().isLoading).toBe(true);
    await promise;

    expect(useAuthStore.getState()).toMatchObject({ isLoading: false, session, profile });
    expect(signIn).toHaveBeenCalledWith('a@b.c', 'secret123');
  });

  it('shares one profile request between concurrent loads', async () => {
    jest.mocked(signIn).mockResolvedValue(session);
    jest.mocked(getMyProfile).mockResolvedValue(profile);

    await Promise.all([
      useAuthStore.getState().signIn('a@b.c', 'secret123'),
      useAuthStore.getState().signIn('a@b.c', 'secret123'),
    ]);

    expect(getMyProfile).toHaveBeenCalledTimes(1);
  });

  it('rethrows service errors and stays signed out', async () => {
    jest.mocked(signIn).mockRejectedValue(new ServiceError('invalidCredentials'));

    await expect(useAuthStore.getState().signIn('a@b.c', 'bad')).rejects.toMatchObject({ code: 'invalidCredentials' });

    expect(useAuthStore.getState()).toMatchObject({ isLoading: false, session: undefined });
  });

  it('signs out again when the profile cannot be loaded', async () => {
    jest.mocked(signIn).mockResolvedValue(session);
    jest.mocked(getMyProfile).mockRejectedValue(new ServiceError('notFound'));
    jest.mocked(signOut).mockResolvedValue(undefined);

    await expect(useAuthStore.getState().signIn('a@b.c', 'secret123')).rejects.toMatchObject({ code: 'notFound' });

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().session).toBeUndefined();
  });

  it('still reports the profile error when the clean-up sign-out fails', async () => {
    jest.mocked(signIn).mockResolvedValue(session);
    jest.mocked(getMyProfile).mockRejectedValue(new ServiceError('notFound'));
    jest.mocked(signOut).mockRejectedValue(new Error('offline'));

    await expect(useAuthStore.getState().signIn('a@b.c', 'secret123')).rejects.toMatchObject({ code: 'notFound' });
  });
});

describe('signOut', () => {
  it('clears all registered stores', async () => {
    const otherStoreReset = jest.fn();
    registerStoreReset(otherStoreReset);
    useAuthStore.setState({ session, profile });
    jest.mocked(signOut).mockResolvedValue(undefined);

    await useAuthStore.getState().signOut();

    expect(otherStoreReset).toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({ session: undefined, profile: undefined });
  });

  it('clears local state even when the request fails', async () => {
    useAuthStore.setState({ session, profile });
    jest.mocked(signOut).mockRejectedValue(new Error('offline'));

    await expect(useAuthStore.getState().signOut()).rejects.toThrow('offline');

    expect(useAuthStore.getState().session).toBeUndefined();
  });
});

describe('changePassword', () => {
  it('changes the password and reloads the profile', async () => {
    useAuthStore.setState({ session, profile: { ...profile, mustChangePassword: true } });
    jest.mocked(changePassword).mockResolvedValue(undefined);
    jest.mocked(getMyProfile).mockResolvedValue(profile);

    await useAuthStore.getState().changePassword('new-secret-1');

    expect(changePassword).toHaveBeenCalledWith('new-secret-1');
    expect(useAuthStore.getState().profile?.mustChangePassword).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('rethrows weak password errors', async () => {
    useAuthStore.setState({ session, profile });
    jest.mocked(changePassword).mockRejectedValue(new ServiceError('weakPassword'));

    await expect(useAuthStore.getState().changePassword('1')).rejects.toMatchObject({ code: 'weakPassword' });
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});

describe('refreshProfile and updateName', () => {
  it('do nothing without a session', async () => {
    await useAuthStore.getState().refreshProfile();
    await useAuthStore.getState().updateName('Bob');

    expect(getMyProfile).not.toHaveBeenCalled();
    expect(updateMyName).not.toHaveBeenCalled();
  });

  it('refreshes the profile', async () => {
    useAuthStore.setState({ session });
    jest.mocked(getMyProfile).mockResolvedValue(profile);

    await useAuthStore.getState().refreshProfile();

    expect(useAuthStore.getState().profile).toEqual(profile);
  });

  it('updates the name', async () => {
    useAuthStore.setState({ session, profile });
    jest.mocked(updateMyName).mockResolvedValue({ ...profile, fullName: 'Bob' });

    await useAuthStore.getState().updateName('Bob');

    expect(updateMyName).toHaveBeenCalledWith('u1', 'Bob');
    expect(useAuthStore.getState().profile?.fullName).toBe('Bob');
  });
});
