import { Text as RNText, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { TextColor, Theme } from '@/theme';

interface TextProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'bold';
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  /** Marks the text as a heading for screen readers. */
  heading?: boolean;
  /** Announces changes politely (validation and status messages). */
  live?: boolean;
  testID?: string;
}

export function Text({
  children,
  size = 'md',
  weight = 'normal',
  color = 'default',
  align = 'left',
  numberOfLines,
  heading = false,
  live = false,
  testID,
}: TextProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <RNText
      style={[styles[size], styles[weight], styles[`color_${color}`], styles[`align_${align}`]]}
      numberOfLines={numberOfLines}
      accessibilityRole={heading ? 'header' : undefined}
      accessibilityLiveRegion={live ? 'polite' : undefined}
      testID={testID}
    >
      {children}
    </RNText>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    sm: theme.fontSizes.sm,
    md: theme.fontSizes.md,
    lg: theme.fontSizes.lg,
    xl: theme.fontSizes.xl,
    normal: { fontWeight: theme.fontWeights.normal },
    medium: { fontWeight: theme.fontWeights.medium },
    bold: { fontWeight: theme.fontWeights.bold },
    color_default: { color: theme.colors.text },
    color_muted: { color: theme.colors.textMuted },
    color_primary: { color: theme.colors.primary },
    color_error: { color: theme.colors.error },
    color_success: { color: theme.colors.success },
    color_warning: { color: theme.colors.warning },
    color_inverse: { color: theme.colors.textInverse },
    align_left: { textAlign: 'left' },
    align_center: { textAlign: 'center' },
    align_right: { textAlign: 'right' },
  });
