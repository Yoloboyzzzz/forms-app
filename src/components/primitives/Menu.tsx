import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';

interface MenuItem {
  label: string;
  onPress: () => void;
}

interface MenuProps {
  items: MenuItem[];
  visible: boolean;
  onClose: () => void;
}

export function Menu({ items, visible, onClose }: MenuProps) {
  if (!visible) return null;

  return (
    <>
      <Pressable onPress={onClose} style={styles.overlay} />
      <View style={styles.menu}>
        {items.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => {
              item.onPress();
              onClose();
            }}
            style={styles.menuItem}
          >
            <Text size="md">{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  menu: { position: 'absolute' },
  menuItem: {},
});
