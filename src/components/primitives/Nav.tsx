import { View, StyleSheet } from 'react-native';

interface NavProps {
  children: React.ReactNode;
}

export function Nav({ children }: NavProps) {
  return <View style={styles.base}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row' },
});
