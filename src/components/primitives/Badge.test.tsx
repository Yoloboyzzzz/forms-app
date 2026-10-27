import { render, screen } from '@testing-library/react-native';
import { lightColors } from '@/theme/colors';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders the label', () => {
    render(<Badge label="Draft" testID="b" />);
    expect(screen.getByText('Draft')).toBeTruthy();
    expect(screen.getByTestId('b')).toHaveStyle({ backgroundColor: lightColors.surfaceMuted });
  });

  it.each([
    ['success', lightColors.successBackground],
    ['warning', lightColors.warningBackground],
    ['error', lightColors.errorBackground],
  ] as const)('uses the %s background', (variant, background) => {
    render(<Badge label="x" variant={variant} testID="b" />);
    expect(screen.getByTestId('b')).toHaveStyle({ backgroundColor: background });
  });
});
