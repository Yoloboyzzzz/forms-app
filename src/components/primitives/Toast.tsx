import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Text } from './Text';

interface ToastProps {
  message: string;
  variant?: 'default' | 'success' | 'error';
  visible: boolean;
  testID?: string;
}

export function Toast({ message, variant = 'default', visible, testID }: ToastProps) {
  const styles = useThemedStyles(createStyles);

  if (!visible) return null;

  return (
    <View
      style={[styles.base, styles[variant]]}
      accessibilityRole="alert"
      accessibilityLiveRegion={variant === 'error' ? 'assertive' : 'polite'}
      testID={testID}
    >
      <Text size="sm" weight="medium" color={variant}>{message}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      position: 'absolute',
      bottom: theme.spacing.md,
      start: theme.spacing.md,
      end: theme.spacing.md,
      minHeight: theme.minTouchTarget,
      justifyContent: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.radii.md,
    },
    default: { backgroundColor: theme.colors.surfaceMuted },
    success: { backgroundColor: theme.colors.successBackground },
    error: { backgroundColor: theme.colors.errorBackground },
  });
