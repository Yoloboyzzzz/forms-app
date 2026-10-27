import { fireEvent, render, screen } from '@testing-library/react-native';
import { Radio } from './Radio';

describe('Radio', () => {
  it('reports its value when pressed', () => {
    const onSelect = jest.fn();
    render(<Radio label="Yes" value="yes" selected={false} onSelect={onSelect} testID="r" />);
    fireEvent.press(screen.getByTestId('r'));
    expect(onSelect).toHaveBeenCalledWith('yes');
  });

  it('exposes selected state', () => {
    render(<Radio label="Yes" value="yes" selected onSelect={jest.fn()} testID="r" />);
    expect(screen.getByRole('radio', { selected: true })).toBeTruthy();
  });

  it('ignores presses when disabled', () => {
    const onSelect = jest.fn();
    render(<Radio label="Yes" value="yes" selected={false} onSelect={onSelect} disabled testID="r" />);
    fireEvent.press(screen.getByTestId('r'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
