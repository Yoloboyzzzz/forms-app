import { Pressable, View, StyleSheet } from 'react-native';
import { Text } from './Text';

interface RadioProps {
  label: string;
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
}

export function Radio({ label, value, selected, onSelect }: RadioProps) {
  return (
    <Pressable onPress={() => onSelect(value)} style={styles.container}>
      <View style={[styles.circle, selected && styles.circleSelected]}>
        {selected && <View style={styles.dot} />}
      </View>
      <Text size="md">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  circle: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  circleSelected: {},
  dot: { borderRadius: 999 },
});
