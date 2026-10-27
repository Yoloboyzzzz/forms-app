import type { ColorTokens } from './colors';

export type TextColor = 'default' | 'muted' | 'primary' | 'error' | 'success' | 'warning' | 'inverse';

const TOKEN_FOR: Record<TextColor, keyof ColorTokens> = {
  default: 'text',
  muted: 'textMuted',
  primary: 'primary',
  error: 'error',
  success: 'success',
  warning: 'warning',
  inverse: 'textInverse',
};

/** Resolves a semantic text colour to the actual colour of the active palette. */
export function resolveTextColor(colors: ColorTokens, color: TextColor): string {
  return colors[TOKEN_FOR[color]];
}
