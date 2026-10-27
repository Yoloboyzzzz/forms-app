import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { RadiusToken, Theme } from '@/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: RadiusToken;
  testID?: string;
}

export function Skeleton({ width = '100%', height = 16, radius = 'sm', testID }: SkeletonProps) {
  const styles = useThemedStyles(createStyles);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.base, styles[radius], { width, minHeight: height, opacity }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      testID={testID}
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: { backgroundColor: theme.colors.surfaceMuted },
    none: { borderRadius: theme.radii.none },
    sm: { borderRadius: theme.radii.sm },
    md: { borderRadius: theme.radii.md },
    lg: { borderRadius: theme.radii.lg },
    pill: { borderRadius: theme.radii.pill },
  });
