import { Pressable, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { TextColor, Theme } from '@/theme';
import { Spinner } from './Spinner';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

const LABEL_COLOR: Record<ButtonVariant, TextColor> = {
  primary: 'inverse',
  secondary: 'default',
  danger: 'inverse',
  ghost: 'primary',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const styles = useThemedStyles(createStyles);
  const inactive = disabled || isLoading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles[`${variant}Pressed`], inactive && styles.inactive]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: isLoading }}
      testID={testID}
    >
      {isLoading ? <Spinner color={LABEL_COLOR[variant]} /> : <Text weight="medium" color={LABEL_COLOR[variant]}>{label}</Text>}
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      minHeight: theme.minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radii.md,
    },
    primary: { backgroundColor: theme.colors.primary },
    primaryPressed: { backgroundColor: theme.colors.primaryPressed },
    secondary: { backgroundColor: theme.colors.surfaceMuted },
    secondaryPressed: { backgroundColor: theme.colors.border },
    danger: { backgroundColor: theme.colors.error },
    dangerPressed: { opacity: 0.85 },
    ghost: { backgroundColor: 'transparent' },
    ghostPressed: { backgroundColor: theme.colors.surfaceMuted },
    inactive: { opacity: 0.5 },
  });
