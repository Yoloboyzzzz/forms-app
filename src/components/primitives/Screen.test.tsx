import { render, screen } from '@testing-library/react-native';
import { lightColors } from '@/theme/colors';
import { Text } from './Text';
import { Screen } from './Screen';

describe('Screen', () => {
  it('scrolls by default', () => {
    render(<Screen testID="s"><Text>content</Text></Screen>);
    expect(screen.getByTestId('s').props.keyboardShouldPersistTaps).toBe('handled');
    expect(screen.getByText('content')).toBeTruthy();
  });

  it('can be a fixed view with the themed background', () => {
    render(<Screen testID="s" scrollable={false} padding="none">{null}</Screen>);
    expect(screen.getByTestId('s')).toHaveStyle({ flex: 1, backgroundColor: lightColors.background });
  });
});
