import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { resolveTextColor, type TextColor } from '@/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IoniconsName;
  size?: number;
  color?: TextColor;
  /** Translated description. Without it the icon is decorative and hidden from screen readers. */
  label?: string;
  testID?: string;
}

export function Icon({ name, size = 24, color = 'default', label, testID }: IconProps) {
  const theme = useTheme();
  const decorative = label === undefined;

  return (
    <Ionicons
      name={name}
      size={size}
      color={resolveTextColor(theme.colors, color)}
      accessibilityLabel={label}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      testID={testID}
    />
  );
}
