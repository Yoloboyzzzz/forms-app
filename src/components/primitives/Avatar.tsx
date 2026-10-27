import { Image, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Text } from './Text';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
}

export function Avatar({ uri, name, size = 'md', testID }: AvatarProps) {
  const styles = useThemedStyles(createStyles);
  const initials = name
    ? name
        .split(' ')
        .filter((part) => part !== '')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (uri !== undefined) {
    return <Image source={{ uri }} style={[styles.base, styles[size]]} accessibilityLabel={name} testID={testID} />;
  }

  return (
    <View style={[styles.base, styles[size], styles.fallback]} accessibilityLabel={name} testID={testID}>
      <Text size="sm" weight="bold">{initials}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: { borderRadius: theme.radii.pill, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    fallback: { backgroundColor: theme.colors.surfaceMuted },
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 56, height: 56 },
  });
