import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';

interface ContainerProps {
  children: React.ReactNode;
  flex?: number;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  testID?: string;
}

export function Container({ children, flex, padding = 'none', testID }: ContainerProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles[padding], flex !== undefined && { flex }]} testID={testID}>
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    none: { padding: theme.spacing.none },
    sm: { padding: theme.spacing.sm },
    md: { padding: theme.spacing.md },
    lg: { padding: theme.spacing.lg },
  });
