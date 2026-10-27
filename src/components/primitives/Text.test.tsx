import { render, screen } from '@testing-library/react-native';
import { lightColors } from '@/theme/colors';
import { Text } from './Text';

describe('Text', () => {
  it('renders children with the testID', () => {
    render(<Text testID="t">Hello</Text>);
    expect(screen.getByTestId('t')).toHaveTextContent('Hello');
  });

  it('uses theme colour tokens', () => {
    render(<Text testID="t" color="error">Oops</Text>);
    expect(screen.getByTestId('t')).toHaveStyle({ color: lightColors.error });
  });

  it('applies size, weight and alignment', () => {
    render(<Text testID="t" size="xl" weight="bold" align="center">x</Text>);
    expect(screen.getByTestId('t')).toHaveStyle({ fontSize: 20, fontWeight: '700', textAlign: 'center' });
  });

  it('can be read out differently', () => {
    render(<Text testID="t" accessibilityLabel="required">*</Text>);
    expect(screen.getByLabelText('required')).toBeTruthy();
  });

  it('marks headings and live regions for assistive tech', () => {
    render(<Text testID="t" heading live>Title</Text>);
    const node = screen.getByTestId('t');
    expect(node.props.accessibilityRole).toBe('header');
    expect(node.props.accessibilityLiveRegion).toBe('polite');
  });
});
