import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';

interface NavProps {
  children: React.ReactNode;
  testID?: string;
}

export function Nav({ children, testID }: NavProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.base} accessibilityRole="tablist" testID={testID}>
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
    },
  });
