import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';

interface RowProps {
  children: React.ReactNode;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  wrap?: boolean;
  testID?: string;
}

export function Row({
  children,
  gap = 'none',
  align = 'center',
  justify = 'flex-start',
  wrap = false,
  testID,
}: RowProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[styles.base, styles[`gap_${gap}`], { alignItems: align, justifyContent: justify }, wrap && styles.wrap]}
      testID={testID}
    >
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: { flexDirection: 'row' },
    wrap: { flexWrap: 'wrap' },
    gap_none: { gap: theme.spacing.none },
    gap_sm: { gap: theme.spacing.sm },
    gap_md: { gap: theme.spacing.md },
    gap_lg: { gap: theme.spacing.lg },
  });
