import { FALLBACK_LANGUAGE, isLanguage, resolveLanguage } from './languages';

describe('resolveLanguage', () => {
  it('keeps supported languages', () => {
    expect(resolveLanguage('nl')).toBe('nl');
    expect(resolveLanguage('en')).toBe('en');
  });

  it('falls back to Dutch for other languages', () => {
    expect(resolveLanguage('fr')).toBe(FALLBACK_LANGUAGE);
    expect(FALLBACK_LANGUAGE).toBe('nl');
  });

  it('falls back when the code is missing', () => {
    expect(resolveLanguage(null)).toBe('nl');
    expect(resolveLanguage(undefined)).toBe('nl');
  });
});

describe('isLanguage', () => {
  it('narrows supported codes only', () => {
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('de')).toBe(false);
  });
});
