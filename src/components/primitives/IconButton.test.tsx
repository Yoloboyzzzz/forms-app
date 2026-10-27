import { fireEvent, render, screen } from '@testing-library/react-native';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('is a labelled button with a 48pt target', () => {
    render(<IconButton icon="trash" label="Delete" onPress={jest.fn()} testID="b" />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
    expect(screen.getByTestId('b')).toHaveStyle({ minWidth: 48, minHeight: 48 });
  });

  it('calls onPress', () => {
    const onPress = jest.fn();
    render(<IconButton icon="trash" label="Delete" onPress={onPress} testID="b" />);
    fireEvent.press(screen.getByTestId('b'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores presses when disabled', () => {
    const onPress = jest.fn();
    render(<IconButton icon="trash" label="Delete" onPress={onPress} disabled testID="b" />);
    fireEvent.press(screen.getByTestId('b'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('draws the icon', () => {
    render(<IconButton icon="trash" label="Delete" onPress={jest.fn()} color="error" />);
    expect(screen.getByText('trash', { includeHiddenElements: true })).toBeTruthy();
  });
});
