import { fireEvent, render, screen } from '@testing-library/react-native';
import { lightColors } from '@/theme/colors';
import { InputField } from './InputField';

function setup(props: Partial<React.ComponentProps<typeof InputField>> = {}) {
  const onChangeText = jest.fn();
  render(<InputField label="Email" value="" onChangeText={onChangeText} testID="email" {...props} />);
  return { onChangeText };
}

describe('InputField', () => {
  it('shows the label and reports typed text', () => {
    const { onChangeText } = setup();
    expect(screen.getByText('Email')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('email'), 'a@b.c');
    expect(onChangeText).toHaveBeenCalledWith('a@b.c');
  });

  it('labels the input for assistive tech', () => {
    setup({ accessibilityHint: 'Your work address' });
    expect(screen.getByLabelText('Email').props.accessibilityHint).toBe('Your work address');
  });

  it('shows an error with text and icon and derives its testID', () => {
    setup({ error: 'Required' });
    expect(screen.getByTestId('email-error')).toHaveTextContent('Required');
    expect(screen.getByTestId('email')).toHaveStyle({ borderColor: lightColors.error });
  });

  it('shows no error by default', () => {
    setup();
    expect(screen.queryByTestId('email-error')).toBeNull();
  });

  it('can be disabled', () => {
    setup({ disabled: true });
    expect(screen.getByTestId('email').props.editable).toBe(false);
  });

  it('passes keyboard and autofill hints', () => {
    setup({
      keyboardType: 'email-address',
      autoComplete: 'email',
      textContentType: 'emailAddress',
      secureTextEntry: true,
      returnKeyType: 'next',
    });
    const input = screen.getByTestId('email');
    expect(input.props.keyboardType).toBe('email-address');
    expect(input.props.autoComplete).toBe('email');
    expect(input.props.textContentType).toBe('emailAddress');
    expect(input.props.secureTextEntry).toBe(true);
    expect(input.props.returnKeyType).toBe('next');
  });

  it('submits from the keyboard', () => {
    const onSubmitEditing = jest.fn();
    setup({ onSubmitEditing });
    fireEvent(screen.getByTestId('email'), 'submitEditing');
    expect(onSubmitEditing).toHaveBeenCalled();
  });

  it('does not derive an error testID without a testID', () => {
    render(<InputField label="Name" value="" onChangeText={jest.fn()} error="Bad" />);
    expect(screen.getByText('Bad')).toBeTruthy();
  });
});
