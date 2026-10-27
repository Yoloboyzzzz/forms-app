import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme, type Theme } from '@/theme';

/** Theme tokens for the active colour scheme (light/dark follows the system). */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return useMemo(() => getTheme(isDark), [isDark]);
}
