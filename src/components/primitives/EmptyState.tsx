import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Text } from './Text';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  testID?: string;
}

export function EmptyState({ title, description, action, testID }: EmptyStateProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.base} testID={testID}>
      <Text size="lg" weight="bold" align="center" heading>{title}</Text>
      {description !== undefined && <Text align="center" color="muted">{description}</Text>}
      {action !== undefined && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: { alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, padding: theme.spacing.lg },
    action: { marginTop: theme.spacing.sm },
  });
