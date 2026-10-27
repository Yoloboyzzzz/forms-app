import { Pressable, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  testID?: string;
}

export function Checkbox({ label, checked, onChange, disabled = false, testID }: CheckboxProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled]}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      testID={testID}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Icon name="checkmark" size={16} color="inverse" />}
      </View>
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
    box: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.sm,
      backgroundColor: theme.colors.surface,
    },
    boxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  });
