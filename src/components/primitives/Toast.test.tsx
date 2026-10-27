import { render, screen } from '@testing-library/react-native';
import { lightColors } from '@/theme/colors';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders nothing when hidden', () => {
    render(<Toast message="Saved" visible={false} testID="t" />);
    expect(screen.queryByTestId('t')).toBeNull();
  });

  it('shows the message as a polite alert', () => {
    render(<Toast message="Saved" visible variant="success" testID="t" />);
    const toast = screen.getByTestId('t');
    expect(toast.props.accessibilityRole).toBe('alert');
    expect(toast).toHaveTextContent('Saved');
    expect(toast.props.accessibilityLiveRegion).toBe('polite');
    expect(toast).toHaveStyle({ backgroundColor: lightColors.successBackground });
  });

  it('announces errors assertively', () => {
    render(<Toast message="Failed" visible variant="error" testID="t" />);
    expect(screen.getByTestId('t').props.accessibilityLiveRegion).toBe('assertive');
  });

  it('has a default look', () => {
    render(<Toast message="Hi" visible testID="t" />);
    expect(screen.getByTestId('t')).toHaveStyle({ backgroundColor: lightColors.surfaceMuted });
  });
});
