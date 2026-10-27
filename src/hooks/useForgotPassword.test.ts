import { act, renderHook } from '@testing-library/react-native';
import { useForgotPassword } from '@/hooks/useForgotPassword';
import { requestPasswordReset, resetPasswordWithCode } from '@/services/authService';
import { ServiceError } from '@/services/errors';

jest.mock('@/services/authService', () => ({
  requestPasswordReset: jest.fn(),
  resetPasswordWithCode: jest.fn(),
}));

beforeEach(() => jest.resetAllMocks());

describe('useForgotPassword', () => {
  it('starts on the email step', () => {
    const { result } = renderHook(() => useForgotPassword());
    expect(result.current).toMatchObject({ step: 'email', email: '', isLoading: false, errorKey: undefined });
  });

  it('moves to the code step after requesting a code', async () => {
    jest.mocked(requestPasswordReset).mockResolvedValue(undefined);
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => result.current.requestCode(' a@b.co '));

    expect(requestPasswordReset).toHaveBeenCalledWith(' a@b.co ');
    expect(result.current).toMatchObject({ step: 'code', email: 'a@b.co' });
  });

  it('stays on the email step and shows the error when requesting fails', async () => {
    jest.mocked(requestPasswordReset).mockRejectedValue(new ServiceError('rateLimited'));
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => result.current.requestCode('a@b.co'));

    expect(result.current).toMatchObject({ step: 'email', errorKey: 'errors.rateLimited', isLoading: false });
  });

  it('sets the loading flag while a request runs', async () => {
    let finish: () => void = () => undefined;
    jest.mocked(requestPasswordReset).mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const { result } = renderHook(() => useForgotPassword());

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.requestCode('a@b.co');
    });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
      finish();
      await pending;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('resends a code to the same address', async () => {
    jest.mocked(requestPasswordReset).mockResolvedValue(undefined);
    const { result } = renderHook(() => useForgotPassword());
    await act(async () => result.current.requestCode('a@b.co'));

    await act(async () => result.current.resendCode());

    expect(requestPasswordReset).toHaveBeenLastCalledWith('a@b.co');
    expect(requestPasswordReset).toHaveBeenCalledTimes(2);
  });

  it('resets the password with the code', async () => {
    jest.mocked(requestPasswordReset).mockResolvedValue(undefined);
    jest.mocked(resetPasswordWithCode).mockResolvedValue(undefined);
    const { result } = renderHook(() => useForgotPassword());
    await act(async () => result.current.requestCode('a@b.co'));

    await act(async () => result.current.resetPassword('123456', 'new-secret-1'));

    expect(resetPasswordWithCode).toHaveBeenCalledWith('a@b.co', '123456', 'new-secret-1');
    expect(result.current.errorKey).toBeUndefined();
  });

  it('shows a wrong or expired code and clears the error on retry', async () => {
    jest.mocked(requestPasswordReset).mockResolvedValue(undefined);
    jest.mocked(resetPasswordWithCode)
      .mockRejectedValueOnce(new ServiceError('invalidCode'))
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useForgotPassword());
    await act(async () => result.current.requestCode('a@b.co'));

    await act(async () => result.current.resetPassword('000000', 'new-secret-1'));
    expect(result.current.errorKey).toBe('errors.invalidCode');

    await act(async () => result.current.resetPassword('123456', 'new-secret-1'));
    expect(result.current.errorKey).toBeUndefined();
  });
});
