import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { clamp } from '@/utils/clamp';

interface ProgressBarProps {
  /** Progress from 0 to 1; values outside the range are clamped. */
  value: number;
  /** Translated description, for example "Progress". */
  label?: string;
  testID?: string;
}

export function ProgressBar({ value, label, testID }: ProgressBarProps) {
  const styles = useThemedStyles(createStyles);
  const fraction = clamp(value, 0, 1);
  const percent = Math.round(fraction * 100);

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      testID={testID}
    >
      <View style={[styles.fill, { width: `${percent}%` }]} testID={testID === undefined ? undefined : `${testID}-fill`} />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    track: {
      minHeight: theme.spacing.sm,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.surfaceMuted,
      overflow: 'hidden',
    },
    fill: { flex: 1, borderRadius: theme.radii.pill, backgroundColor: theme.colors.primary },
  });
