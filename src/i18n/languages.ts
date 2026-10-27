export const SUPPORTED_LANGUAGES = ['nl', 'en'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/** Used when the device language is neither Dutch nor English (AGENTS.md D22). */
export const FALLBACK_LANGUAGE: Language = 'nl';

export function isLanguage(value: string): value is Language {
  return SUPPORTED_LANGUAGES.some((language) => language === value);
}

/** Maps a device language code such as "en" to a supported language, or the fallback. */
export function resolveLanguage(code: string | null | undefined): Language {
  if (code === null || code === undefined) {
    return FALLBACK_LANGUAGE;
  }
  return isLanguage(code) ? code : FALLBACK_LANGUAGE;
}
