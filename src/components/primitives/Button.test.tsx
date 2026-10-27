import { fireEvent, render, screen } from '@testing-library/react-native';
import { lightColors } from '@/theme/colors';
import { Button } from './Button';

describe('Button', () => {
  it('calls onPress', () => {
    const onPress = jest.fn();
    render(<Button label="Save" onPress={onPress} testID="b" />);
    fireEvent.press(screen.getByTestId('b'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is a labelled button with at least a 48pt target', () => {
    render(<Button label="Save" onPress={jest.fn()} accessibilityHint="Saves the form" testID="b" />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(screen.getByTestId('b')).toHaveStyle({ minHeight: 48 });
    expect(screen.getByTestId('b').props.accessibilityHint).toBe('Saves the form');
  });

  it.each([
    ['primary', lightColors.primary],
    ['secondary', lightColors.surfaceMuted],
    ['danger', lightColors.error],
    ['ghost', 'transparent'],
  ] as const)('styles the %s variant', (variant, background) => {
    render(<Button label="x" onPress={jest.fn()} variant={variant} testID="b" />);
    expect(screen.getByTestId('b')).toHaveStyle({ backgroundColor: background });
  });

  it('ignores presses and shows a spinner while loading', () => {
    const onPress = jest.fn();
    render(<Button label="Save" onPress={onPress} isLoading testID="b" />);
    fireEvent.press(screen.getByTestId('b'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.queryByText('Save')).toBeNull();
    expect(screen.getByTestId('b').props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  });

  it('ignores presses when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Save" onPress={onPress} disabled testID="b" />);
    fireEvent.press(screen.getByTestId('b'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
