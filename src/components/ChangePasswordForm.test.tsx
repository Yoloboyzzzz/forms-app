import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIds } from '@/constants/testIds';
import { ChangePasswordForm } from './ChangePasswordForm';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const ids = testIds.changePassword;

function setup(props: Partial<React.ComponentProps<typeof ChangePasswordForm>> = {}) {
  const onSubmit = jest.fn();
  const onLogout = jest.fn();
  render(<ChangePasswordForm mode="forced" onSubmit={onSubmit} onLogout={onLogout} {...props} />);
  return { onSubmit, onLogout };
}

function fill(password: string, confirmation: string): void {
  fireEvent.changeText(screen.getByTestId(ids.newPasswordInput), password);
  fireEvent.changeText(screen.getByTestId(ids.confirmPasswordInput), confirmation);
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('ChangePasswordForm', () => {
  it('submits a valid new password', () => {
    const { onSubmit } = setup();
    fill('new-secret-1', 'new-secret-1');
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).toHaveBeenCalledWith('new-secret-1');
  });

  it('submits from the keyboard', () => {
    const { onSubmit } = setup();
    fill('new-secret-1', 'new-secret-1');
    fireEvent(screen.getByTestId(ids.confirmPasswordInput), 'submitEditing');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('rejects a password shorter than 8 characters', () => {
    const { onSubmit } = setup();
    fill('short', 'short');
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId(`${ids.newPasswordInput}-error`)).toHaveTextContent(
      'The password must be at least 8 characters.',
    );
  });

  it('rejects a confirmation that does not match', () => {
    const { onSubmit } = setup();
    fill('new-secret-1', 'new-secret-2');
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId(`${ids.confirmPasswordInput}-error`)).toHaveTextContent('The passwords do not match.');
  });

  it('shows a server error, translated', () => {
    setup({ errorKey: 'errors.samePassword' });
    expect(screen.getByTestId(ids.errorText)).toHaveTextContent('Choose a different password than your current one.');
  });

  it('forced mode explains why and offers log out', () => {
    const { onLogout } = setup();
    expect(screen.getByText(/temporary password/)).toBeTruthy();
    fireEvent.press(screen.getByTestId(ids.logoutButton));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('voluntary mode has no hint and no log out', () => {
    setup({ mode: 'voluntary' });
    expect(screen.queryByText(/temporary password/)).toBeNull();
    expect(screen.queryByTestId(ids.logoutButton)).toBeNull();
    expect(screen.getByText('Change password')).toBeTruthy();
  });

  it('forced mode without a log out handler shows no log out button', () => {
    setup({ onLogout: undefined });
    expect(screen.queryByTestId(ids.logoutButton)).toBeNull();
  });

  it('uses new-password autofill hints', () => {
    setup();
    expect(screen.getByTestId(ids.newPasswordInput).props.textContentType).toBe('newPassword');
    expect(screen.getByTestId(ids.newPasswordInput).props.autoComplete).toBe('new-password');
  });
});
