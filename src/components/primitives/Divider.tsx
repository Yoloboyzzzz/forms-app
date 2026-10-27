import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  testID?: string;
}

export function Divider({ orientation = 'horizontal', spacing = 'none', testID }: DividerProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[styles.base, orientation === 'horizontal' ? styles.horizontal : styles.vertical, styles[`spacing_${spacing}`]]}
      accessibilityRole="none"
      testID={testID}
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: { backgroundColor: theme.colors.border },
    horizontal: { height: StyleSheet.hairlineWidth, minHeight: 1, alignSelf: 'stretch' },
    vertical: { width: StyleSheet.hairlineWidth, minWidth: 1, alignSelf: 'stretch' },
    spacing_none: { margin: theme.spacing.none },
    spacing_sm: { margin: theme.spacing.sm },
    spacing_md: { margin: theme.spacing.md },
    spacing_lg: { margin: theme.spacing.lg },
  });
