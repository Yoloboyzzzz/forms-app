import i18n from '@/i18n';
import { useSettingsStore } from './useSettingsStore';

const mockStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => void mockStorage.set(key, value)),
    removeItem: jest.fn(async (key: string) => void mockStorage.delete(key)),
  },
}));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'fr' }] }));

beforeEach(async () => {
  mockStorage.clear();
  await i18n.changeLanguage('nl');
  useSettingsStore.setState({ language: 'nl' });
});

describe('useSettingsStore', () => {
  it('starts with the device language fallback', () => {
    expect(useSettingsStore.getInitialState().language).toBe('nl');
  });

  it('changes the language in the store and in i18n', async () => {
    await useSettingsStore.getState().setLanguage('en');

    expect(useSettingsStore.getState().language).toBe('en');
    expect(i18n.language).toBe('en');
  });

  it('persists only the language', async () => {
    await useSettingsStore.getState().setLanguage('en');

    const stored = mockStorage.get('settings');
    expect(stored).toBeDefined();
    expect(JSON.parse(stored ?? '{}').state).toEqual({ language: 'en' });
  });

  it('applies a stored language when rehydrated', async () => {
    mockStorage.set('settings', JSON.stringify({ state: { language: 'en' }, version: 0 }));

    await useSettingsStore.persist.rehydrate();

    expect(useSettingsStore.getState().language).toBe('en');
    expect(i18n.language).toBe('en');
  });

  it('ignores an unsupported stored language', async () => {
    mockStorage.set('settings', JSON.stringify({ state: { language: 'de' }, version: 0 }));

    await useSettingsStore.persist.rehydrate();

    expect(i18n.language).toBe('nl');
  });
});
