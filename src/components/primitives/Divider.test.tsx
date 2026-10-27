import { render, screen } from '@testing-library/react-native';
import { Divider } from './Divider';

describe('Divider', () => {
  it('is horizontal by default', () => {
    render(<Divider testID="d" />);
    expect(screen.getByTestId('d')).toHaveStyle({ minHeight: 1 });
  });

  it('can be vertical with spacing', () => {
    render(<Divider testID="d" orientation="vertical" spacing="md" />);
    expect(screen.getByTestId('d')).toHaveStyle({ minWidth: 1, margin: 16 });
  });
});
