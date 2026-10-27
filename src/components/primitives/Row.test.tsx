import { render, screen } from '@testing-library/react-native';
import { Row } from './Row';

describe('Row', () => {
  it('lays children out in a row', () => {
    render(<Row testID="r" gap="sm" justify="space-between">{null}</Row>);
    expect(screen.getByTestId('r')).toHaveStyle({
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'space-between',
    });
  });

  it('wraps when asked', () => {
    render(<Row testID="r" wrap>{null}</Row>);
    expect(screen.getByTestId('r')).toHaveStyle({ flexWrap: 'wrap' });
  });
});
