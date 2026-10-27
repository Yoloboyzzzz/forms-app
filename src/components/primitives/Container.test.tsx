import { render, screen } from '@testing-library/react-native';
import { Container } from './Container';

describe('Container', () => {
  it('applies padding and flex', () => {
    render(<Container testID="c" padding="sm" flex={2}>{null}</Container>);
    expect(screen.getByTestId('c')).toHaveStyle({ padding: 8, flex: 2 });
  });
});
