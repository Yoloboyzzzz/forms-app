import { act, renderHook } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { useClipboard } from '@/hooks/useClipboard';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

beforeEach(() => jest.resetAllMocks());

describe('useClipboard', () => {
  it('copies text and reports it', async () => {
    jest.mocked(Clipboard.setStringAsync).mockResolvedValue(true);
    const { result } = renderHook(() => useClipboard());
    expect(result.current.copied).toBe(false);

    await act(async () => result.current.copy('secret'));

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('secret');
    expect(result.current.copied).toBe(true);
  });

  it('does not report success when copying failed', async () => {
    jest.mocked(Clipboard.setStringAsync).mockResolvedValue(false);
    const { result } = renderHook(() => useClipboard());

    await act(async () => result.current.copy('secret'));

    expect(result.current.copied).toBe(false);
  });

  it('can be reset', async () => {
    jest.mocked(Clipboard.setStringAsync).mockResolvedValue(true);
    const { result } = renderHook(() => useClipboard());
    await act(async () => result.current.copy('secret'));

    act(() => result.current.reset());

    expect(result.current.copied).toBe(false);
  });
});
