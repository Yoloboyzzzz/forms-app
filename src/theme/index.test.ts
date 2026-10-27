import { darkColors, lightColors, type ColorTokens } from '@/theme/colors';
import { getTheme } from '@/theme';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
] as [string, ColorTokens][])('%s colours', (_name, colors) => {
  it.each([
    ['text', 'background'],
    ['text', 'surface'],
    ['textMuted', 'background'],
    ['textMuted', 'surface'],
    ['onPrimary', 'primary'],
    ['success', 'successBackground'],
    ['warning', 'warningBackground'],
    ['error', 'errorBackground'],
    ['error', 'background'],
  ] as [keyof ColorTokens, keyof ColorTokens][])('%s on %s has contrast >= 4.5', (fg, bg) => {
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('getTheme', () => {
  it('returns the light palette', () => {
    const theme = getTheme(false);
    expect(theme.isDark).toBe(false);
    expect(theme.colors).toBe(lightColors);
  });

  it('returns the dark palette', () => {
    const theme = getTheme(true);
    expect(theme.isDark).toBe(true);
    expect(theme.colors).toBe(darkColors);
  });

  it('keeps touch targets at 48', () => {
    expect(getTheme(false).minTouchTarget).toBe(48);
  });
});
