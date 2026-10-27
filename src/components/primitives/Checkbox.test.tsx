import { fireEvent, render, screen } from '@testing-library/react-native';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('toggles on press', () => {
    const onChange = jest.fn();
    render(<Checkbox label="Agree" checked={false} onChange={onChange} testID="c" />);
    fireEvent.press(screen.getByTestId('c'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('exposes checked state to assistive tech', () => {
    const onChange = jest.fn();
    render(<Checkbox label="Agree" checked onChange={onChange} testID="c" />);
    expect(screen.getByRole('checkbox', { checked: true })).toBeTruthy();
    fireEvent.press(screen.getByTestId('c'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('ignores presses when disabled', () => {
    const onChange = jest.fn();
    render(<Checkbox label="Agree" checked={false} onChange={onChange} disabled testID="c" />);
    fireEvent.press(screen.getByTestId('c'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
