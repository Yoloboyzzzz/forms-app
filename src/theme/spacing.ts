export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Minimum touch target (pt/dp), AGENTS.md §10.1. */
export const minTouchTarget = 48;
