import { fireEvent, render, screen } from '@testing-library/react-native';
import '@/i18n';
import i18n from '@/i18n';
import { testIds } from '@/constants/testIds';
import { LoginForm } from './LoginForm';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

function setup(props: Partial<React.ComponentProps<typeof LoginForm>> = {}) {
  const onSubmit = jest.fn();
  const onForgotPassword = jest.fn();
  render(<LoginForm onSubmit={onSubmit} onForgotPassword={onForgotPassword} {...props} />);
  return { onSubmit, onForgotPassword };
}

function fill(email: string, password: string): void {
  fireEvent.changeText(screen.getByTestId(testIds.login.emailInput), email);
  fireEvent.changeText(screen.getByTestId(testIds.login.passwordInput), password);
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('LoginForm', () => {
  it('submits valid credentials', () => {
    const { onSubmit } = setup();
    fill('a@b.co', 'secret123');
    fireEvent.press(screen.getByTestId(testIds.login.submitButton));
    expect(onSubmit).toHaveBeenCalledWith('a@b.co', 'secret123');
  });

  it('submits from the keyboard on the password field', () => {
    const { onSubmit } = setup();
    fill('a@b.co', 'secret123');
    fireEvent(screen.getByTestId(testIds.login.passwordInput), 'submitEditing');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows inline errors and does not submit empty fields', () => {
    const { onSubmit } = setup();
    fireEvent.press(screen.getByTestId(testIds.login.submitButton));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId(`${testIds.login.emailInput}-error`)).toHaveTextContent('This field is required.');
    expect(screen.getByTestId(`${testIds.login.passwordInput}-error`)).toHaveTextContent('This field is required.');
  });

  it('rejects a malformed email', () => {
    const { onSubmit } = setup();
    fill('nope', 'secret123');
    fireEvent.press(screen.getByTestId(testIds.login.submitButton));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId(`${testIds.login.emailInput}-error`)).toHaveTextContent('Enter a valid email address.');
  });

  it('clears field errors once the values are fixed', () => {
    setup();
    fireEvent.press(screen.getByTestId(testIds.login.submitButton));
    fill('a@b.co', 'secret123');
    fireEvent.press(screen.getByTestId(testIds.login.submitButton));
    expect(screen.queryByTestId(`${testIds.login.emailInput}-error`)).toBeNull();
  });

  it('shows a failed sign-in, translated', () => {
    setup({ errorKey: 'errors.invalidCredentials' });
    expect(screen.getByTestId(testIds.login.errorText)).toHaveTextContent('Invalid email or password.');
  });

  it('shows the error in Dutch when the language changes', async () => {
    await i18n.changeLanguage('nl');
    setup({ errorKey: 'errors.invalidCredentials' });
    expect(screen.getByTestId(testIds.login.errorText)).toHaveTextContent('Ongeldig e-mailadres of wachtwoord.');
  });

  it('has no error text by default', () => {
    setup();
    expect(screen.queryByTestId(testIds.login.errorText)).toBeNull();
  });

  it('blocks submission while loading', () => {
    const { onSubmit } = setup({ isLoading: true });
    fill('a@b.co', 'secret123');
    fireEvent.press(screen.getByTestId(testIds.login.submitButton));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('opens forgot password', () => {
    const { onForgotPassword } = setup();
    fireEvent.press(screen.getByTestId(testIds.login.forgotPasswordLink));
    expect(onForgotPassword).toHaveBeenCalledTimes(1);
  });

  it('sets autofill hints for password managers', () => {
    setup();
    expect(screen.getByTestId(testIds.login.emailInput).props.textContentType).toBe('emailAddress');
    expect(screen.getByTestId(testIds.login.passwordInput).props.textContentType).toBe('password');
    expect(screen.getByTestId(testIds.login.passwordInput).props.secureTextEntry).toBe(true);
  });
});
