import { render, screen } from '@testing-library/react-native';
import { OfflineBanner } from './OfflineBanner';

describe('OfflineBanner', () => {
  it('renders nothing when online', () => {
    render(<OfflineBanner visible={false} message="Offline" testID="o" />);
    expect(screen.queryByTestId('o')).toBeNull();
  });

  it('announces the message politely when offline', () => {
    render(<OfflineBanner visible message="You are offline" testID="o" />);
    expect(screen.getByText('You are offline')).toBeTruthy();
    expect(screen.getByTestId('o').props.accessibilityLiveRegion).toBe('polite');
  });
});
