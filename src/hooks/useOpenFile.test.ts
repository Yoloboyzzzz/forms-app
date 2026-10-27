import { act, renderHook } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { useOpenFile } from '@/hooks/useOpenFile';
import { ServiceError } from '@/services/errors';
import { getSignedUrl } from '@/services/storageService';

jest.mock('@/services/storageService', () => ({ getSignedUrl: jest.fn() }));

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
});

describe('useOpenFile', () => {
  it('opens a private file through a temporary link', async () => {
    jest.mocked(getSignedUrl).mockResolvedValue('https://x/y?token=1');
    const { result } = renderHook(() => useOpenFile());

    await act(async () => result.current.open('form-uploads', 'a/b.pdf'));

    expect(getSignedUrl).toHaveBeenCalledWith('form-uploads', 'a/b.pdf');
    expect(Linking.openURL).toHaveBeenCalledWith('https://x/y?token=1');
    expect(result.current.errorKey).toBeUndefined();
  });

  it('shows why a file could not be opened and clears it on the next try', async () => {
    jest.mocked(getSignedUrl).mockRejectedValueOnce(new ServiceError('notFound')).mockResolvedValueOnce('https://x');
    const { result } = renderHook(() => useOpenFile());

    await act(async () => result.current.open('form-uploads', 'gone'));
    expect(result.current.errorKey).toBe('errors.notFound');

    await act(async () => result.current.open('form-uploads', 'ok'));
    expect(result.current.errorKey).toBeUndefined();
  });
});
