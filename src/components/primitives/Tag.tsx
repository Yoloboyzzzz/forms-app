import { Pressable, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Text } from './Text';

interface TagProps {
  label: string;
  onRemove?: () => void;
  /** Translated label for the remove button, for example "Remove Reports". */
  removeLabel?: string;
  testID?: string;
}

export function Tag({ label, onRemove, removeLabel, testID }: TagProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.base} testID={testID}>
      <Text size="sm">{label}</Text>
      {onRemove !== undefined && (
        <Pressable
          onPress={onRemove}
          style={styles.removeButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={removeLabel}
          testID={testID === undefined ? undefined : `${testID}-remove`}
        >
          <Text size="sm" weight="bold">×</Text>
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.surfaceMuted,
    },
    removeButton: { paddingHorizontal: theme.spacing.xs },
  });
