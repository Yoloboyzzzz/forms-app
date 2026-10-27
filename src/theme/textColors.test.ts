import { darkColors, lightColors } from './colors';
import { resolveTextColor } from './textColors';

describe('resolveTextColor', () => {
  it('maps semantic colours to palette values', () => {
    expect(resolveTextColor(lightColors, 'default')).toBe(lightColors.text);
    expect(resolveTextColor(lightColors, 'muted')).toBe(lightColors.textMuted);
    expect(resolveTextColor(darkColors, 'error')).toBe(darkColors.error);
    expect(resolveTextColor(darkColors, 'inverse')).toBe(darkColors.textInverse);
  });
});
