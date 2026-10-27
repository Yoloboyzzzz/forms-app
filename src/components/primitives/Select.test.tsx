import { fireEvent, render, screen } from '@testing-library/react-native';
import { Select } from './Select';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

function setup(props: Partial<React.ComponentProps<typeof Select>> = {}) {
  const onChange = jest.fn();
  render(<Select label="Letter" options={options} onChange={onChange} testID="sel" {...props} />);
  return { onChange };
}

describe('Select', () => {
  it('shows the placeholder, then the selected label', () => {
    setup({ placeholder: 'Pick one' });
    expect(screen.getByText('Pick one')).toBeTruthy();
  });

  it('shows the selected option', () => {
    setup({ value: 'b' });
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.getByTestId('sel').props.accessibilityValue).toEqual({ text: 'Beta' });
  });

  it('shows an empty trigger without value or placeholder', () => {
    setup();
    expect(screen.getByTestId('sel')).toBeTruthy();
  });

  it('opens the list, picks an option and closes', () => {
    const { onChange } = setup();
    expect(screen.queryByTestId('sel-option-a')).toBeNull();
    fireEvent.press(screen.getByTestId('sel'));
    fireEvent.press(screen.getByTestId('sel-option-b'));
    expect(onChange).toHaveBeenCalledWith('b');
    expect(screen.queryByTestId('sel-option-b')).toBeNull();
  });

  it('marks the current option as selected', () => {
    setup({ value: 'a' });
    fireEvent.press(screen.getByTestId('sel'));
    expect(screen.getByTestId('sel-option-a').props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId('sel-option-b').props.accessibilityState).toMatchObject({ selected: false });
  });

  it('closes from the backdrop', () => {
    setup({ closeLabel: 'Close list' });
    fireEvent.press(screen.getByTestId('sel'));
    fireEvent.press(screen.getByLabelText('Close list'));
    expect(screen.queryByTestId('sel-option-a')).toBeNull();
  });

  it('shows an error with a derived testID', () => {
    setup({ error: 'Required' });
    expect(screen.getByTestId('sel-error')).toHaveTextContent('Required');
  });

  it('cannot be opened when disabled', () => {
    setup({ disabled: true });
    fireEvent.press(screen.getByTestId('sel'));
    expect(screen.queryByTestId('sel-option-a')).toBeNull();
  });

  it('can hide the visible label but keeps it for screen readers', () => {
    setup({ hideLabel: true });
    expect(screen.queryByText('Letter')).toBeNull();
    expect(screen.getByLabelText('Letter')).toBeTruthy();
  });

  it('works without a testID', () => {
    setup({ testID: undefined, error: 'Bad' });
    fireEvent.press(screen.getByLabelText('Letter'));
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Bad')).toBeTruthy();
  });
});
