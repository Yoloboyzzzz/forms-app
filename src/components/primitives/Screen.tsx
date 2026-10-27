import { ScrollView, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  scrollable?: boolean;
  testID?: string;
}

export function Screen({ children, padding = 'md', scrollable = true, testID }: ScreenProps) {
  const styles = useThemedStyles(createStyles);

  if (!scrollable) {
    return (
      <View style={[styles.container, styles[padding]]} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, styles[padding]]}
      keyboardShouldPersistTaps="handled"
      testID={testID}
    >
      {children}
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { flexGrow: 1 },
    none: { padding: theme.spacing.none },
    sm: { padding: theme.spacing.sm },
    md: { padding: theme.spacing.md },
    lg: { padding: theme.spacing.lg },
  });
