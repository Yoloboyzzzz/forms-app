import { Pressable, View, StyleSheet } from 'react-native';
import { Text } from './Text';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <Pressable onPress={() => onChange(!checked)} style={styles.container}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Text size="sm">✓</Text>}
      </View>
      <Text size="md">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  box: {},
  boxChecked: {},
});
