import { darkColors, lightColors, type ColorTokens } from './colors';
import { radii } from './radii';
import { minTouchTarget, spacing } from './spacing';
import { fontSizes, fontWeights } from './typography';

export interface Theme {
  isDark: boolean;
  colors: ColorTokens;
  spacing: typeof spacing;
  radii: typeof radii;
  fontSizes: typeof fontSizes;
  fontWeights: typeof fontWeights;
  minTouchTarget: number;
}

export function getTheme(isDark: boolean): Theme {
  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
    spacing,
    radii,
    fontSizes,
    fontWeights,
    minTouchTarget,
  };
}

export type { ColorTokens } from './colors';
export type { SpacingToken } from './spacing';
export type { RadiusToken } from './radii';
export type { FontSizeToken, FontWeightToken } from './typography';
