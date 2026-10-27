import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';

interface StackProps {
  children: React.ReactNode;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  flex?: number;
  testID?: string;
}

export function Stack({
  children,
  gap = 'none',
  align = 'stretch',
  justify = 'flex-start',
  padding = 'none',
  flex,
  testID,
}: StackProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[
        styles.base,
        styles[`gap_${gap}`],
        styles[`padding_${padding}`],
        { alignItems: align, justifyContent: justify },
        flex !== undefined && { flex },
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: { flexDirection: 'column' },
    gap_none: { gap: theme.spacing.none },
    gap_sm: { gap: theme.spacing.sm },
    gap_md: { gap: theme.spacing.md },
    gap_lg: { gap: theme.spacing.lg },
    padding_none: { padding: theme.spacing.none },
    padding_sm: { padding: theme.spacing.sm },
    padding_md: { padding: theme.spacing.md },
    padding_lg: { padding: theme.spacing.lg },
  });
