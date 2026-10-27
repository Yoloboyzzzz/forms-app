import { act, renderHook } from '@testing-library/react-native';
import { useUsersScreen } from '@/hooks/useUsersScreen';
import { ServiceError } from '@/services/errors';
import type { Profile } from '@/types/models';

const mockUsers = {
  users: [] as Profile[],
  isLoading: false,
  isLoaded: true,
  errorKey: undefined as string | undefined,
  load: jest.fn(),
  resetPassword: jest.fn(),
  setRole: jest.fn(),
};
const mockAuth = { session: { userId: 'me' } };
const mockClipboard = { copied: false, copy: jest.fn(), reset: jest.fn() };

jest.mock('@/state/useUsersStore', () => ({
  useUsersStore: (selector: (state: typeof mockUsers) => unknown) => selector(mockUsers),
}));
jest.mock('@/state/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof mockAuth) => unknown) => selector(mockAuth),
}));
jest.mock('@/hooks/useClipboard', () => ({ useClipboard: () => mockClipboard }));
jest.mock('@/hooks/useGeneratePassword', () => ({ useGeneratePassword: () => () => 'Generated1234' }));

function profile(id: string, role: Profile['role'] = 'user', fullName = id): Profile {
  return {
    id,
    email: `${id}@b.c`,
    fullName,
    role,
    mustChangePassword: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

beforeEach(() => {
  mockUsers.load = jest.fn().mockResolvedValue(undefined);
  mockUsers.resetPassword = jest.fn().mockResolvedValue(undefined);
  mockUsers.setRole = jest.fn().mockResolvedValue(undefined);
  mockUsers.errorKey = undefined;
  mockClipboard.copy = jest.fn();
  mockClipboard.reset = jest.fn();
});

describe('useUsersScreen', () => {
  it('loads the users on mount and exposes store state', () => {
    mockUsers.users = [profile('u1')];
    const { result } = renderHook(() => useUsersScreen());

    expect(mockUsers.load).toHaveBeenCalledTimes(1);
    expect(result.current.users).toHaveLength(1);
    expect(result.current.currentUserId).toBe('me');
  });

  it('reloads on demand', () => {
    const { result } = renderHook(() => useUsersScreen());
    act(() => result.current.reload());
    expect(mockUsers.load).toHaveBeenCalledTimes(2);
  });

  describe('password reset', () => {
    it('waits for confirmation, then resets with a generated password and shows it once', async () => {
      const { result } = renderHook(() => useUsersScreen());
      act(() => result.current.requestReset(profile('u1', 'user', 'Ann')));
      expect(result.current.pending).toMatchObject({ kind: 'reset' });
      expect(mockUsers.resetPassword).not.toHaveBeenCalled();

      await act(async () => result.current.confirmPending());

      expect(mockUsers.resetPassword).toHaveBeenCalledWith('u1', 'Generated1234');
      expect(result.current.issuedPassword).toEqual({ userName: 'Ann', password: 'Generated1234' });
      expect(result.current.pending).toBeUndefined();
      expect(result.current.isWorking).toBe(false);
    });

    it('uses the email as name when the name is empty', async () => {
      const { result } = renderHook(() => useUsersScreen());
      act(() => result.current.requestReset(profile('u1', 'user', '')));
      await act(async () => result.current.confirmPending());
      expect(result.current.issuedPassword?.userName).toBe('u1@b.c');
    });

    it('keeps the dialog open and shows the error when resetting fails', async () => {
      mockUsers.resetPassword.mockRejectedValue(new ServiceError('forbidden'));
      const { result } = renderHook(() => useUsersScreen());
      act(() => result.current.requestReset(profile('u1')));

      await act(async () => result.current.confirmPending());

      expect(result.current.actionErrorKey).toBe('errors.forbidden');
      expect(result.current.pending).toBeDefined();
      expect(result.current.issuedPassword).toBeUndefined();
    });

    it('can be cancelled', () => {
      const { result } = renderHook(() => useUsersScreen());
      act(() => result.current.requestReset(profile('u1')));
      act(() => result.current.cancelPending());
      expect(result.current.pending).toBeUndefined();
    });

    it('copies and dismisses the issued password', async () => {
      const { result } = renderHook(() => useUsersScreen());
      act(() => result.current.requestReset(profile('u1')));
      await act(async () => result.current.confirmPending());

      act(() => result.current.copyPassword());
      expect(mockClipboard.copy).toHaveBeenCalledWith('Generated1234');

      act(() => result.current.dismissPassword());
      expect(result.current.issuedPassword).toBeUndefined();
      expect(mockClipboard.reset).toHaveBeenCalled();
    });

    it('does not copy when there is no password', () => {
      const { result } = renderHook(() => useUsersScreen());
      act(() => result.current.copyPassword());
      expect(mockClipboard.copy).not.toHaveBeenCalled();
    });
  });

  describe('role change', () => {
    it('proposes the opposite role and applies it after confirmation', async () => {
      const { result } = renderHook(() => useUsersScreen());
      act(() => result.current.requestRoleChange(profile('u1', 'user')));
      expect(result.current.pending).toMatchObject({ kind: 'role', role: 'admin' });

      await act(async () => result.current.confirmPending());

      expect(mockUsers.setRole).toHaveBeenCalledWith('u1', 'admin');
      expect(result.current.pending).toBeUndefined();
    });

    it('proposes demoting an admin', () => {
      const { result } = renderHook(() => useUsersScreen());
      act(() => result.current.requestRoleChange(profile('u1', 'admin')));
      expect(result.current.pending).toMatchObject({ role: 'user' });
    });

    it('shows an error when the change is refused', async () => {
      mockUsers.setRole.mockRejectedValue(new ServiceError('forbidden'));
      const { result } = renderHook(() => useUsersScreen());
      act(() => result.current.requestRoleChange(profile('u1')));

      await act(async () => result.current.confirmPending());

      expect(result.current.actionErrorKey).toBe('errors.forbidden');
    });
  });

  it('ignores confirming without a pending action', async () => {
    const { result } = renderHook(() => useUsersScreen());
    await act(async () => result.current.confirmPending());
    expect(mockUsers.resetPassword).not.toHaveBeenCalled();
    expect(mockUsers.setRole).not.toHaveBeenCalled();
  });
});
