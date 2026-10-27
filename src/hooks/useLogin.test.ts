import { act, renderHook } from '@testing-library/react-native';
import { useLogin } from '@/hooks/useLogin';
import { ServiceError } from '@/services/errors';

const mockState = { signIn: jest.fn(), isLoading: false };

jest.mock('@/state/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

beforeEach(() => {
  mockState.signIn = jest.fn();
  mockState.isLoading = false;
});

describe('useLogin', () => {
  it('signs in through the store', async () => {
    mockState.signIn.mockResolvedValue(undefined);
    const { result } = renderHook(() => useLogin());

    await act(async () => result.current.signIn('a@b.c', 'secret123'));

    expect(mockState.signIn).toHaveBeenCalledWith('a@b.c', 'secret123');
    expect(result.current.errorKey).toBeUndefined();
  });

  it('exposes the failure as an i18n key', async () => {
    mockState.signIn.mockRejectedValue(new ServiceError('invalidCredentials'));
    const { result } = renderHook(() => useLogin());

    await act(async () => result.current.signIn('a@b.c', 'bad'));

    expect(result.current.errorKey).toBe('errors.invalidCredentials');
  });

  it('clears the previous error on the next attempt', async () => {
    mockState.signIn.mockRejectedValueOnce(new ServiceError('invalidCredentials')).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useLogin());

    await act(async () => result.current.signIn('a@b.c', 'bad'));
    await act(async () => result.current.signIn('a@b.c', 'good-password'));

    expect(result.current.errorKey).toBeUndefined();
  });

  it('passes the loading flag through', () => {
    mockState.isLoading = true;
    const { result } = renderHook(() => useLogin());
    expect(result.current.isLoading).toBe(true);
  });
});
