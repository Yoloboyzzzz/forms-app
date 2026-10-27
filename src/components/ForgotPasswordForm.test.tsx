import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIds } from '@/constants/testIds';
import { ForgotPasswordForm } from './ForgotPasswordForm';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const ids = testIds.forgotPassword;

function setup(props: Partial<React.ComponentProps<typeof ForgotPasswordForm>> = {}) {
  const handlers = {
    onRequestCode: jest.fn(),
    onResendCode: jest.fn(),
    onSubmit: jest.fn(),
    onBackToLogin: jest.fn(),
  };
  render(<ForgotPasswordForm step="email" {...handlers} {...props} />);
  return handlers;
}

function fillCodeStep(code: string, password: string, confirmation: string): void {
  fireEvent.changeText(screen.getByTestId(ids.codeInput), code);
  fireEvent.changeText(screen.getByTestId(ids.newPasswordInput), password);
  fireEvent.changeText(screen.getByTestId(ids.confirmPasswordInput), confirmation);
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('ForgotPasswordForm, email step', () => {
  it('requests a code for a valid email', () => {
    const { onRequestCode } = setup();
    fireEvent.changeText(screen.getByTestId(ids.emailInput), 'a@b.co');
    fireEvent.press(screen.getByTestId(ids.sendCodeButton));
    expect(onRequestCode).toHaveBeenCalledWith('a@b.co');
  });

  it('requests a code from the keyboard', () => {
    const { onRequestCode } = setup();
    fireEvent.changeText(screen.getByTestId(ids.emailInput), 'a@b.co');
    fireEvent(screen.getByTestId(ids.emailInput), 'submitEditing');
    expect(onRequestCode).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid email inline', () => {
    const { onRequestCode } = setup();
    fireEvent.changeText(screen.getByTestId(ids.emailInput), 'nope');
    fireEvent.press(screen.getByTestId(ids.sendCodeButton));
    expect(onRequestCode).not.toHaveBeenCalled();
    expect(screen.getByTestId(`${ids.emailInput}-error`)).toHaveTextContent('Enter a valid email address.');
  });

  it('does not show the code fields or the neutral message yet', () => {
    setup();
    expect(screen.queryByTestId(ids.codeInput)).toBeNull();
    expect(screen.queryByTestId(ids.neutralMessage)).toBeNull();
  });

  it('shows a request failure', () => {
    setup({ errorKey: 'errors.rateLimited' });
    expect(screen.getByTestId(ids.errorText)).toHaveTextContent('Too many attempts. Wait a moment and try again.');
  });

  it('goes back to login', () => {
    const { onBackToLogin } = setup();
    fireEvent.press(screen.getByTestId(ids.backToLoginLink));
    expect(onBackToLogin).toHaveBeenCalledTimes(1);
  });
});

describe('ForgotPasswordForm, code step', () => {
  it('shows the same neutral message regardless of the address', () => {
    setup({ step: 'code' });
    expect(screen.getByTestId(ids.neutralMessage)).toHaveTextContent(
      'If this address has an account, you will receive an email with a code.',
    );
  });

  it('submits a code and a new password', () => {
    const { onSubmit } = setup({ step: 'code' });
    fillCodeStep(' 123456 ', 'new-secret-1', 'new-secret-1');
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).toHaveBeenCalledWith('123456', 'new-secret-1');
  });

  it('submits from the keyboard', () => {
    const { onSubmit } = setup({ step: 'code' });
    fillCodeStep('123456', 'new-secret-1', 'new-secret-1');
    fireEvent(screen.getByTestId(ids.confirmPasswordInput), 'submitEditing');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('validates the code, password and confirmation inline', () => {
    const { onSubmit } = setup({ step: 'code' });
    fillCodeStep('12', 'short', 'other');
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId(`${ids.codeInput}-error`)).toHaveTextContent('The code has 6 digits.');
    expect(screen.getByTestId(`${ids.newPasswordInput}-error`)).toBeTruthy();
    expect(screen.getByTestId(`${ids.confirmPasswordInput}-error`)).toHaveTextContent('The passwords do not match.');
  });

  it('shows an invalid or expired code error', () => {
    setup({ step: 'code', errorKey: 'errors.invalidCode' });
    expect(screen.getByTestId(ids.errorText)).toHaveTextContent('The code is invalid or has expired.');
  });

  it('offers to send a new code', () => {
    const { onResendCode } = setup({ step: 'code' });
    fireEvent.press(screen.getByTestId(ids.resendButton));
    expect(onResendCode).toHaveBeenCalledTimes(1);
  });

  it('does not allow resending while loading', () => {
    const { onResendCode } = setup({ step: 'code', isLoading: true });
    fireEvent.press(screen.getByTestId(ids.resendButton));
    expect(onResendCode).not.toHaveBeenCalled();
  });

  it('asks for a one-time code with the right keyboard', () => {
    setup({ step: 'code' });
    expect(screen.getByTestId(ids.codeInput).props.keyboardType).toBe('number-pad');
    expect(screen.getByTestId(ids.codeInput).props.textContentType).toBe('oneTimeCode');
  });
});
