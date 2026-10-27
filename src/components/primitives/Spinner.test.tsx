import { render, screen } from '@testing-library/react-native';
import { lightColors } from '@/theme/colors';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('announces itself as a progress indicator', () => {
    render(<Spinner label="Loading" testID="s" />);
    expect(screen.getByTestId('s').props.accessibilityRole).toBe('progressbar');
    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('uses the primary colour by default', () => {
    render(<Spinner testID="s" />);
    expect(screen.getByTestId('s').props.color).toBe(lightColors.primary);
  });

  it('accepts a size and colour token', () => {
    render(<Spinner testID="s" size="large" color="inverse" />);
    expect(screen.getByTestId('s').props.size).toBe('large');
    expect(screen.getByTestId('s').props.color).toBe(lightColors.textInverse);
  });
});
