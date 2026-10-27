import { Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';

interface NavItemProps {
  label: string;
  onPress: () => void;
  active?: boolean;
  icon?: string;
}

export function NavItem({ label, onPress, active = false }: NavItemProps) {
  return (
    <Pressable onPress={onPress} style={[styles.base, active && styles.active]}>
      <Text size="md" weight={active ? 'bold' : 'normal'}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {},
  active: {},
});
