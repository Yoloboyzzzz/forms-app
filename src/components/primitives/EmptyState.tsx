import { View, StyleSheet } from 'react-native';
import { Text } from './Text';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.base}>
      <Text size="lg" weight="bold" align="center">{title}</Text>
      {description !== undefined && <Text align="center">{description}</Text>}
      {action !== undefined && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  action: {},
});
