import { act, renderHook } from '@testing-library/react-native';
import { useProfileScreen } from '@/hooks/useProfileScreen';
import { ServiceError } from '@/services/errors';

const mockAuth = {
  profile: { id: 'u1', fullName: 'Ann' },
  updateName: jest.fn(),
  signOut: jest.fn(),
};
const mockSettings = { language: 'nl', setLanguage: jest.fn() };
const mockPasswordChange = { changePassword: jest.fn(), isLoading: false, errorKey: undefined as string | undefined };

jest.mock('@/state/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof mockAuth) => unknown) => selector(mockAuth),
}));
jest.mock('@/state/useSettingsStore', () => ({
  useSettingsStore: (selector: (state: typeof mockSettings) => unknown) => selector(mockSettings),
}));
jest.mock('@/hooks/useChangePassword', () => ({ useChangePassword: () => mockPasswordChange }));

beforeEach(() => {
  mockAuth.updateName = jest.fn();
  mockAuth.signOut = jest.fn();
  mockSettings.setLanguage = jest.fn().mockResolvedValue(undefined);
  mockPasswordChange.changePassword = jest.fn();
  mockPasswordChange.isLoading = false;
  mockPasswordChange.errorKey = undefined;
});

describe('useProfileScreen', () => {
  it('exposes the profile, language and logout', () => {
    const { result } = renderHook(() => useProfileScreen());
    expect(result.current.profile).toBe(mockAuth.profile);
    expect(result.current.language).toBe('nl');
    expect(result.current.logout).toBe(mockAuth.signOut);
  });

  it('changes the language through the settings store', () => {
    const { result } = renderHook(() => useProfileScreen());
    act(() => result.current.setLanguage('en'));
    expect(mockSettings.setLanguage).toHaveBeenCalledWith('en');
  });

  it('saves the name and reports success', async () => {
    mockAuth.updateName.mockResolvedValue(undefined);
    const { result } = renderHook(() => useProfileScreen());

    await act(async () => result.current.saveName('Anna'));

    expect(mockAuth.updateName).toHaveBeenCalledWith('Anna');
    expect(result.current).toMatchObject({ nameSaved: true, isSavingName: false, nameErrorKey: undefined });
  });

  it('reports a failed name save and clears it on the next attempt', async () => {
    mockAuth.updateName.mockRejectedValueOnce(new ServiceError('network')).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useProfileScreen());

    await act(async () => result.current.saveName('Anna'));
    expect(result.current).toMatchObject({ nameSaved: false, nameErrorKey: 'errors.network' });

    await act(async () => result.current.saveName('Anna'));
    expect(result.current).toMatchObject({ nameSaved: true, nameErrorKey: undefined });
  });

  it('reports a changed password', async () => {
    mockPasswordChange.changePassword.mockResolvedValue(true);
    const { result } = renderHook(() => useProfileScreen());

    await act(async () => result.current.changePassword('new-secret-1'));

    expect(mockPasswordChange.changePassword).toHaveBeenCalledWith('new-secret-1');
    expect(result.current.passwordChanged).toBe(true);
  });

  it('does not report success when the change failed', async () => {
    mockPasswordChange.changePassword.mockResolvedValue(false);
    mockPasswordChange.errorKey = 'errors.weakPassword';
    const { result } = renderHook(() => useProfileScreen());

    await act(async () => result.current.changePassword('1'));

    expect(result.current.passwordChanged).toBe(false);
    expect(result.current.passwordErrorKey).toBe('errors.weakPassword');
  });

  it('passes the password loading flag through', () => {
    mockPasswordChange.isLoading = true;
    expect(renderHook(() => useProfileScreen()).result.current.isChangingPassword).toBe(true);
  });
});
