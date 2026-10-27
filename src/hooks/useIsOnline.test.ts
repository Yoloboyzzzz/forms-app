import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { act, renderHook } from '@testing-library/react-native';
import { useIsOnline } from '@/hooks/useIsOnline';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn() },
}));

type Listener = (state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>) => void;

function setup() {
  let listener: Listener | undefined;
  const unsubscribe = jest.fn();
  jest.mocked(NetInfo.addEventListener).mockImplementation((callback) => {
    listener = callback as unknown as Listener; // the hook only reads the two fields passed in the tests
    return unsubscribe;
  });
  const hook = renderHook(() => useIsOnline());
  return { hook, unsubscribe, emit: (state: Parameters<Listener>[0]) => act(() => listener?.(state)) };
}

beforeEach(() => jest.resetAllMocks());

describe('useIsOnline', () => {
  it('assumes online at first', () => {
    expect(setup().hook.result.current).toBe(true);
  });

  it('goes offline when the connection is lost', () => {
    const { hook, emit } = setup();
    emit({ isConnected: false, isInternetReachable: false });
    expect(hook.result.current).toBe(false);
  });

  it('goes offline when connected without internet', () => {
    const { hook, emit } = setup();
    emit({ isConnected: true, isInternetReachable: false });
    expect(hook.result.current).toBe(false);
  });

  it('stays online while reachability is unknown, and comes back', () => {
    const { hook, emit } = setup();
    emit({ isConnected: true, isInternetReachable: null });
    expect(hook.result.current).toBe(true);
    emit({ isConnected: false, isInternetReachable: false });
    emit({ isConnected: true, isInternetReachable: true });
    expect(hook.result.current).toBe(true);
  });

  it('stops listening on unmount', () => {
    const { hook, unsubscribe } = setup();
    hook.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
