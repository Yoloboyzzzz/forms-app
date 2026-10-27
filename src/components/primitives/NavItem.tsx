import { Pressable, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

type IconName = React.ComponentProps<typeof Icon>['name'];

interface NavItemProps {
  label: string;
  onPress: () => void;
  active?: boolean;
  icon?: IconName;
  testID?: string;
}

export function NavItem({ label, onPress, active = false, icon, testID }: NavItemProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, active && styles.active]}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      testID={testID}
    >
      {icon !== undefined && <Icon name={icon} size={22} color={active ? 'primary' : 'muted'} />}
      <Text size="sm" weight={active ? 'bold' : 'normal'} color={active ? 'primary' : 'muted'}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      flex: 1,
      minHeight: theme.minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
    },
    active: { borderTopColor: theme.colors.primary, borderTopWidth: 2 },
  });
