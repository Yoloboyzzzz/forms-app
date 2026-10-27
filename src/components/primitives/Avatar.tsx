import { View, Image, StyleSheet } from 'react-native';
import { Text } from './Text';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const initials = name
    ? name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (uri !== undefined) {
    return <Image source={{ uri }} style={[styles.base, styles[size]]} />;
  }

  return (
    <View style={[styles.base, styles[size], styles.fallback]}>
      <Text size="sm">{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  fallback: {},
  sm: {},
  md: {},
  lg: {},
});
