import { View, StyleSheet } from 'react-native';

interface ContainerProps {
  children: React.ReactNode;
  flex?: number;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Container({ children, flex, padding = 'none' }: ContainerProps) {
  return (
    <View style={[styles.base, flex !== undefined && { flex }, styles[padding]]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {},
  none: {},
  sm: {},
  md: {},
  lg: {},
});
