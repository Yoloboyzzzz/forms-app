const mockCreateClient = jest.fn();
const mockStartAutoRefresh = jest.fn();
const mockStopAutoRefresh = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => {
    mockCreateClient(...args);
    return { auth: { startAutoRefresh: mockStartAutoRefresh, stopAutoRefresh: mockStopAutoRefresh } };
  },
}));
jest.mock('@/config/env', () => ({ env: { supabaseUrl: 'https://x.supabase.co', supabasePublishableKey: 'key' } }));

type AppStateListener = (state: string) => void;

describe('supabase client', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function load(os: 'ios' | 'web'): { getListener: () => AppStateListener | undefined } {
    let listener: AppStateListener | undefined;
    jest.doMock('react-native', () => ({
      Platform: { OS: os },
      AppState: {
        addEventListener: (_event: string, callback: AppStateListener) => {
          listener = callback;
        },
      },
    }));
    jest.doMock('./authStorage', () => ({ authStorage: os === 'web' ? undefined : { kind: 'secure' } }));
    require('./client');
    return { getListener: () => listener };
  }

  it('creates a client with the public env values and native storage', () => {
    load('ios');
    expect(mockCreateClient).toHaveBeenCalledWith('https://x.supabase.co', 'key', {
      auth: {
        storage: { kind: 'secure' },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  });

  it('starts and stops token refresh with the app state on native', () => {
    const { getListener } = load('ios');
    getListener()?.('active');
    expect(mockStartAutoRefresh).toHaveBeenCalled();
    getListener()?.('background');
    expect(mockStopAutoRefresh).toHaveBeenCalled();
  });

  it('detects sessions in the url on web and skips the app state listener', () => {
    const { getListener } = load('web');
    expect(getListener()).toBeUndefined();
    expect(mockCreateClient.mock.calls[0][2].auth.detectSessionInUrl).toBe(true);
  });
});
