import { getLocales } from 'expo-localization';
import i18n, { detectDeviceLanguage, setLanguage } from '@/i18n';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

describe('i18n', () => {
  it('detects the device language', () => {
    expect(detectDeviceLanguage()).toBe('en');
  });

  it('falls back to Dutch for unsupported or missing locales', () => {
    jest.mocked(getLocales).mockReturnValueOnce([]);
    expect(detectDeviceLanguage()).toBe('nl');
  });

  it('translates in both languages', async () => {
    await setLanguage('nl');
    expect(i18n.t('common.cancel')).toBe('Annuleren');
    await setLanguage('en');
    expect(i18n.t('common.cancel')).toBe('Cancel');
  });
});
