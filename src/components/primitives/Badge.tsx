import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Text } from './Text';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  testID?: string;
}

export function Badge({ label, variant = 'default', testID }: BadgeProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.base, styles[variant]]} testID={testID}>
      <Text size="sm" weight="medium" color={variant}>{label}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.pill,
    },
    default: { backgroundColor: theme.colors.surfaceMuted },
    success: { backgroundColor: theme.colors.successBackground },
    warning: { backgroundColor: theme.colors.warningBackground },
    error: { backgroundColor: theme.colors.errorBackground },
  });
