import { View, StyleSheet } from 'react-native';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

export function Divider({ orientation = 'horizontal', spacing = 'none' }: DividerProps) {
  return (
    <View
      style={[
        styles.base,
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        styles[`spacing_${spacing}` as keyof typeof styles],
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {},
  horizontal: { height: 1, width: '100%' },
  vertical: { width: 1, height: '100%' },
  spacing_none: {},
  spacing_sm: {},
  spacing_md: {},
  spacing_lg: {},
});
