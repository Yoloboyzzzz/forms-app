import { Pressable, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  testID?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Translated description of the whole control. */
  label?: string;
  testID?: string;
}

/** A few mutually exclusive choices side by side, such as "To do" and "Submitted". */
export function SegmentedControl<T extends string>({ options, value, onChange, label, testID }: SegmentedControlProps<T>) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container} accessibilityRole="tablist" accessibilityLabel={label} testID={testID}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.selected]}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            testID={option.testID}
          >
            <Text weight={selected ? 'bold' : 'normal'} color={selected ? 'inverse' : 'default'}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: theme.spacing.xs,
      gap: theme.spacing.xs,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
    },
    segment: {
      flex: 1,
      minHeight: theme.minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.sm,
    },
    selected: { backgroundColor: theme.colors.primary },
  });
