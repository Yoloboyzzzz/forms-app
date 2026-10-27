import { View, StyleSheet } from 'react-native';
import { Text } from './Text';

interface ToastProps {
  message: string;
  variant?: 'default' | 'success' | 'error';
  visible: boolean;
}

export function Toast({ message, variant = 'default', visible }: ToastProps) {
  if (!visible) return null;

  return (
    <View style={[styles.base, styles[variant]]}>
      <Text size="sm">{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  default: {},
  success: {},
  error: {},
});
