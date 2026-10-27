import { Pressable, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { TextColor, Theme } from '@/theme';
import { Icon } from './Icon';

type IconName = React.ComponentProps<typeof Icon>['name'];

interface IconButtonProps {
  icon: IconName;
  /** Translated description; required because the button has no visible text. */
  label: string;
  onPress: () => void;
  color?: TextColor;
  disabled?: boolean;
  testID?: string;
}

export function IconButton({ icon, label, onPress, color = 'default', disabled = false, testID }: IconButtonProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.base, pressed && styles.pressed, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      testID={testID}
    >
      <Icon name={icon} size={22} color={color} />
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      minWidth: theme.minTouchTarget,
      minHeight: theme.minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.md,
    },
    pressed: { backgroundColor: theme.colors.surfaceMuted },
    disabled: { opacity: 0.4 },
  });
