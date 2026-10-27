import { Image, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';

interface QuestionImageProps {
  uri: string;
  /** Description for screen readers; the question title is a good default. */
  description: string;
  testID?: string;
}

/** The picture an admin attached to a question. */
export function QuestionImage({ uri, description, testID }: QuestionImageProps) {
  const styles = useThemedStyles(createStyles);

  return <Image source={{ uri }} style={styles.image} resizeMode="contain" accessibilityLabel={description} testID={testID} />;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    image: { width: '100%', minHeight: 160, borderRadius: theme.radii.md, backgroundColor: theme.colors.surfaceMuted },
  });
