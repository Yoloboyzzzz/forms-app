import { useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

/** Builds a component's StyleSheet from the active theme tokens; rebuilt only when the theme changes. */
export function useThemedStyles<T>(createStyles: (theme: Theme) => T): T {
  const theme = useTheme();
  // createStyles is a module-level function in every component, so it never changes between renders.
  return useMemo(() => createStyles(theme), [theme]);
}
