export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radii;
