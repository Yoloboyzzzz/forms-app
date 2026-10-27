import { act, renderHook } from '@testing-library/react-native';
import { useCreateUser } from '@/hooks/useCreateUser';
import { ServiceError } from '@/services/errors';

const mockUsers = { createUser: jest.fn() };
const mockClipboard = { copied: false, copy: jest.fn(), reset: jest.fn() };

jest.mock('@/state/useUsersStore', () => ({
  useUsersStore: (selector: (state: typeof mockUsers) => unknown) => selector(mockUsers),
}));
jest.mock('@/hooks/useClipboard', () => ({ useClipboard: () => mockClipboard }));
jest.mock('@/hooks/useGeneratePassword', () => ({ useGeneratePassword: () => () => 'Generated1234' }));

const input = { fullName: 'Ann', email: 'ann@b.c', role: 'user', password: 'first-time-1' } as const;

beforeEach(() => {
  mockUsers.createUser = jest.fn();
  mockClipboard.copy = jest.fn();
  mockClipboard.reset = jest.fn();
});

describe('useCreateUser', () => {
  it('creates the user and keeps the password to show once', async () => {
    mockUsers.createUser.mockResolvedValue('u9');
    const { result } = renderHook(() => useCreateUser());

    await act(async () => result.current.createUser(input));

    expect(mockUsers.createUser).toHaveBeenCalledWith(input);
    expect(result.current.created).toEqual({ userName: 'Ann', password: 'first-time-1' });
    expect(result.current.errorKey).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('shows a duplicate email error and does not report a creation', async () => {
    mockUsers.createUser.mockRejectedValue(new ServiceError('duplicate'));
    const { result } = renderHook(() => useCreateUser());

    await act(async () => result.current.createUser(input));

    expect(result.current.errorKey).toBe('errors.duplicate');
    expect(result.current.created).toBeUndefined();
  });

  it('clears the error on the next attempt', async () => {
    mockUsers.createUser.mockRejectedValueOnce(new ServiceError('duplicate')).mockResolvedValueOnce('u9');
    const { result } = renderHook(() => useCreateUser());

    await act(async () => result.current.createUser(input));
    await act(async () => result.current.createUser(input));

    expect(result.current.errorKey).toBeUndefined();
  });

  it('generates and copies passwords', () => {
    const { result } = renderHook(() => useCreateUser());
    expect(result.current.generatePassword()).toBe('Generated1234');
    act(() => result.current.copyPassword('first-time-1'));
    expect(mockClipboard.copy).toHaveBeenCalledWith('first-time-1');
  });

  it('forgets the password when dismissed', async () => {
    mockUsers.createUser.mockResolvedValue('u9');
    const { result } = renderHook(() => useCreateUser());
    await act(async () => result.current.createUser(input));

    act(() => result.current.dismissCreated());

    expect(result.current.created).toBeUndefined();
    expect(mockClipboard.reset).toHaveBeenCalled();
  });
});
