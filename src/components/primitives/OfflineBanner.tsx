import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

interface OfflineBannerProps {
  visible: boolean;
  message: string;
  testID?: string;
}

export function OfflineBanner({ visible, message, testID }: OfflineBannerProps) {
  const styles = useThemedStyles(createStyles);

  if (!visible) return null;

  return (
    <View style={styles.base} accessibilityRole="alert" accessibilityLiveRegion="polite" testID={testID}>
      <Icon name="cloud-offline" size={18} color="warning" />
      <Text size="sm" weight="medium" color="warning">{message}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      minHeight: theme.minTouchTarget,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.warningBackground,
    },
  });
