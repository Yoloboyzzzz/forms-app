import { act, renderHook } from '@testing-library/react-native';
import { useChangePassword } from '@/hooks/useChangePassword';
import { ServiceError } from '@/services/errors';

const mockState = { changePassword: jest.fn(), isLoading: false };

jest.mock('@/state/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

beforeEach(() => {
  mockState.changePassword = jest.fn();
  mockState.isLoading = false;
});

describe('useChangePassword', () => {
  it('returns true when the password was changed', async () => {
    mockState.changePassword.mockResolvedValue(undefined);
    const { result } = renderHook(() => useChangePassword());

    let changed = false;
    await act(async () => {
      changed = await result.current.changePassword('new-secret-1');
    });

    expect(changed).toBe(true);
    expect(mockState.changePassword).toHaveBeenCalledWith('new-secret-1');
    expect(result.current.errorKey).toBeUndefined();
  });

  it('returns false and exposes the failure as an i18n key', async () => {
    mockState.changePassword.mockRejectedValue(new ServiceError('samePassword'));
    const { result } = renderHook(() => useChangePassword());

    let changed = true;
    await act(async () => {
      changed = await result.current.changePassword('same');
    });

    expect(changed).toBe(false);
    expect(result.current.errorKey).toBe('errors.samePassword');
  });

  it('clears the previous error on the next attempt', async () => {
    mockState.changePassword.mockRejectedValueOnce(new ServiceError('weakPassword')).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useChangePassword());

    await act(async () => void (await result.current.changePassword('1')));
    await act(async () => void (await result.current.changePassword('long-enough-1')));

    expect(result.current.errorKey).toBeUndefined();
  });

  it('passes the loading flag through', () => {
    mockState.isLoading = true;
    expect(renderHook(() => useChangePassword()).result.current.isLoading).toBe(true);
  });
});
