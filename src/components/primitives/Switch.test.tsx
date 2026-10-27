import { fireEvent, render, screen } from '@testing-library/react-native';
import { Switch } from './Switch';

describe('Switch', () => {
  it('shows the label and reports changes', () => {
    const onValueChange = jest.fn();
    render(<Switch label="Show progress" value={false} onValueChange={onValueChange} testID="s" />);
    expect(screen.getByText('Show progress')).toBeTruthy();
    fireEvent(screen.getByTestId('s'), 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('exposes switch state to assistive tech', () => {
    render(<Switch label="Show progress" value onValueChange={jest.fn()} testID="s" />);
    expect(screen.getByRole('switch', { checked: true })).toBeTruthy();
  });

  it('can be disabled', () => {
    render(<Switch label="x" value={false} onValueChange={jest.fn()} disabled testID="s" />);
    expect(screen.getByTestId('s').props.accessibilityState).toMatchObject({ disabled: true });
  });
});
