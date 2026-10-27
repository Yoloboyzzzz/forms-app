import { Pressable, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Text } from './Text';

interface MenuItem {
  label: string;
  onPress: () => void;
  testID?: string;
}

interface MenuProps {
  items: MenuItem[];
  visible: boolean;
  onClose: () => void;
  /** Translated label for the invisible backdrop that closes the menu. */
  closeLabel?: string;
  testID?: string;
}

export function Menu({ items, visible, onClose, closeLabel, testID }: MenuProps) {
  const styles = useThemedStyles(createStyles);

  if (!visible) return null;

  return (
    <>
      <Pressable
        onPress={onClose}
        style={styles.overlay}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        testID={testID === undefined ? undefined : `${testID}-backdrop`}
      />
      <View style={styles.menu} accessibilityRole="menu" testID={testID}>
        {items.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => {
              item.onPress();
              onClose();
            }}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            accessibilityRole="menuitem"
            accessibilityLabel={item.label}
            testID={item.testID}
          >
            <Text size="md">{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: { position: 'absolute', top: 0, start: 0, end: 0, bottom: 0 },
    menu: {
      position: 'absolute',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.radii.md,
      paddingVertical: theme.spacing.xs,
    },
    menuItem: {
      minHeight: theme.minTouchTarget,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.md,
    },
    menuItemPressed: { backgroundColor: theme.colors.surfaceMuted },
  });
