import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';

interface TagProps {
  label: string;
  onRemove?: () => void;
}

export function Tag({ label, onRemove }: TagProps) {
  return (
    <View style={styles.base}>
      <Text size="sm">{label}</Text>
      {onRemove !== undefined && (
        <Pressable onPress={onRemove} style={styles.removeButton}>
          <Text size="sm">×</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center' },
  removeButton: {},
});
