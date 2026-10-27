import { act, renderHook } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';

const mockState = { isBootstrapped: false, bootstrap: jest.fn() };

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hideAsync: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('@/state/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

beforeEach(() => {
  mockState.isBootstrapped = false;
  mockState.bootstrap = jest.fn();
  jest.mocked(SplashScreen.hideAsync).mockClear();
});

describe('useAppBootstrap', () => {
  it('keeps the splash screen while the session is being restored', async () => {
    mockState.bootstrap.mockResolvedValue(jest.fn());

    const { result } = renderHook(() => useAppBootstrap());
    await act(async () => undefined);

    expect(result.current).toBe(false);
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it('hides the splash screen once restored', async () => {
    mockState.isBootstrapped = true;
    mockState.bootstrap.mockResolvedValue(jest.fn());

    const { result } = renderHook(() => useAppBootstrap());
    await act(async () => undefined);

    expect(result.current).toBe(true);
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });

  it('stops listening on unmount', async () => {
    const stop = jest.fn();
    mockState.bootstrap.mockResolvedValue(stop);

    const { unmount } = renderHook(() => useAppBootstrap());
    await act(async () => undefined);
    unmount();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('stops listening when unmounted before the session was restored', async () => {
    const stop = jest.fn();
    let finish: (cleanup: () => void) => void = () => undefined;
    mockState.bootstrap.mockReturnValue(new Promise<() => void>((resolve) => (finish = resolve)));

    const { unmount } = renderHook(() => useAppBootstrap());
    unmount();
    await act(async () => finish(stop));

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('ignores splash screen errors', async () => {
    mockState.isBootstrapped = true;
    mockState.bootstrap.mockResolvedValue(jest.fn());
    jest.mocked(SplashScreen.hideAsync).mockRejectedValueOnce(new Error('no splash'));

    renderHook(() => useAppBootstrap());

    await expect(act(async () => undefined)).resolves.toBeUndefined();
  });
});
