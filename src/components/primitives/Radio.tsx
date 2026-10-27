import { Pressable, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Text } from './Text';

interface RadioProps {
  label: string;
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
  disabled?: boolean;
  testID?: string;
}

export function Radio({ label, value, selected, onSelect, disabled = false, testID }: RadioProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={() => onSelect(value)}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled]}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      testID={testID}
    >
      <View style={[styles.circle, selected && styles.circleSelected]}>{selected && <View style={styles.dot} />}</View>
      <Text size="md">{label}</Text>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      minHeight: theme.minTouchTarget,
    },
    disabled: { opacity: 0.5 },
    circle: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.surface,
    },
    circleSelected: { borderColor: theme.colors.primary },
    dot: { width: 12, height: 12, borderRadius: theme.radii.pill, backgroundColor: theme.colors.primary },
  });
