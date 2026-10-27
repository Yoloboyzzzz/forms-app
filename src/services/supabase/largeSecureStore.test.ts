import { LargeSecureStore } from './largeSecureStore';

const mockSecure = new Map<string, string>();
const mockPlain = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (key: string, value: string) => void mockSecure.set(key, value)),
  getItemAsync: jest.fn(async (key: string) => mockSecure.get(key) ?? null),
  deleteItemAsync: jest.fn(async (key: string) => void mockSecure.delete(key)),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(async (key: string, value: string) => void mockPlain.set(key, value)),
    getItem: jest.fn(async (key: string) => mockPlain.get(key) ?? null),
    removeItem: jest.fn(async (key: string) => void mockPlain.delete(key)),
  },
}));
jest.mock('expo-crypto', () => ({
  getRandomBytes: (length: number) => Uint8Array.from({ length }, (_, i) => (i * 7 + 3) % 256),
}));

describe('LargeSecureStore', () => {
  beforeEach(() => {
    mockSecure.clear();
    mockPlain.clear();
  });

  it('round-trips a value larger than the SecureStore limit', async () => {
    const store = new LargeSecureStore();
    const session = JSON.stringify({ token: 'x'.repeat(5000), text: 'café ✓' });
    await store.setItem('session', session);
    expect(await store.getItem('session')).toBe(session);
  });

  it('keeps only the key in SecureStore and only ciphertext in AsyncStorage', async () => {
    const store = new LargeSecureStore();
    await store.setItem('session', 'secret-value');
    expect(mockSecure.get('session')).toHaveLength(64);
    expect(mockPlain.get('session')).toBeDefined();
    expect(mockPlain.get('session')).not.toContain('secret');
  });

  it('returns null when nothing is stored', async () => {
    expect(await new LargeSecureStore().getItem('missing')).toBeNull();
  });

  it('returns null when the key is gone', async () => {
    const store = new LargeSecureStore();
    await store.setItem('session', 'v');
    mockSecure.clear();
    expect(await store.getItem('session')).toBeNull();
  });

  it('removes both parts', async () => {
    const store = new LargeSecureStore();
    await store.setItem('session', 'v');
    await store.removeItem('session');
    expect(mockSecure.has('session')).toBe(false);
    expect(mockPlain.has('session')).toBe(false);
  });
});
