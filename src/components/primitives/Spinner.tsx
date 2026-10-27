import { ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { resolveTextColor, type TextColor } from '@/theme';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: TextColor;
  /** Translated description, for example "Loading". */
  label?: string;
  testID?: string;
}

export function Spinner({ size = 'small', color = 'primary', label, testID }: SpinnerProps) {
  const theme = useTheme();

  return (
    <ActivityIndicator
      size={size}
      color={resolveTextColor(theme.colors, color)}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      testID={testID}
    />
  );
}
