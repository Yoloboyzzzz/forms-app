import { render, screen } from '@testing-library/react-native';
import { Icon } from './Icon';

describe('Icon', () => {
  it('is hidden from screen readers when decorative', () => {
    render(<Icon name="checkmark" testID="i" />);
    expect(screen.getByTestId('i', { includeHiddenElements: true }).props.accessibilityElementsHidden).toBe(true);
  });

  it('exposes a label when given', () => {
    render(<Icon name="checkmark" label="Done" testID="i" />);
    expect(screen.getByLabelText('Done')).toBeTruthy();
  });
});
