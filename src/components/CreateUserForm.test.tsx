import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor, testIds } from '@/constants/testIds';
import { CreateUserForm } from './CreateUserForm';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const ids = testIds.createUser;

function setup(props: Partial<React.ComponentProps<typeof CreateUserForm>> = {}) {
  const handlers = {
    onSubmit: jest.fn(),
    onGeneratePassword: jest.fn(() => 'Generated1234'),
    onCopyPassword: jest.fn(),
  };
  render(<CreateUserForm {...handlers} {...props} />);
  return handlers;
}

function fill(name: string, email: string, password: string): void {
  fireEvent.changeText(screen.getByTestId(ids.nameInput), name);
  fireEvent.changeText(screen.getByTestId(ids.emailInput), email);
  fireEvent.changeText(screen.getByTestId(ids.passwordInput), password);
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('CreateUserForm', () => {
  it('submits a new user with the default role', () => {
    const { onSubmit } = setup();
    fill(' Ann ', ' ann@example.com ', 'first-time-1');
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).toHaveBeenCalledWith({
      fullName: 'Ann',
      email: 'ann@example.com',
      role: 'user',
      password: 'first-time-1',
    });
  });

  it('submits an admin when chosen', () => {
    const { onSubmit } = setup();
    fill('Ann', 'ann@example.com', 'first-time-1');
    fireEvent.press(screen.getByTestId(testIdFor.createUserRole('admin')));
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
  });

  it('submits from the keyboard on the password field', () => {
    const { onSubmit } = setup();
    fill('Ann', 'ann@example.com', 'first-time-1');
    fireEvent(screen.getByTestId(ids.passwordInput), 'submitEditing');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('validates every field inline', () => {
    const { onSubmit } = setup();
    fill('', 'nope', 'short');
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId(`${ids.nameInput}-error`)).toHaveTextContent('This field is required.');
    expect(screen.getByTestId(`${ids.emailInput}-error`)).toHaveTextContent('Enter a valid email address.');
    expect(screen.getByTestId(`${ids.passwordInput}-error`)).toHaveTextContent('The password must be at least 8 characters.');
  });

  it('fills in a generated password', () => {
    const { onGeneratePassword } = setup();
    fireEvent.press(screen.getByTestId(ids.generateButton));
    expect(onGeneratePassword).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId(ids.passwordInput).props.value).toBe('Generated1234');
  });

  it('shows the password as plain text so it can be handed over', () => {
    setup();
    expect(screen.getByTestId(ids.passwordInput).props.secureTextEntry).toBe(false);
  });

  it('copies the current password', () => {
    const { onCopyPassword } = setup();
    fireEvent.changeText(screen.getByTestId(ids.passwordInput), 'first-time-1');
    fireEvent.press(screen.getByTestId(ids.copyButton));
    expect(onCopyPassword).toHaveBeenCalledWith('first-time-1');
  });

  it('cannot copy an empty password', () => {
    const { onCopyPassword } = setup();
    fireEvent.press(screen.getByTestId(ids.copyButton));
    expect(onCopyPassword).not.toHaveBeenCalled();
  });

  it('confirms a copy', () => {
    setup({ copied: true });
    expect(screen.getByText('Copied')).toBeTruthy();
  });

  it('shows a duplicate email error from the server', () => {
    setup({ errorKey: 'errors.duplicate' });
    expect(screen.getByTestId(ids.errorText)).toHaveTextContent('This already exists.');
  });

  it('blocks submitting while loading', () => {
    const { onSubmit } = setup({ isLoading: true });
    fill('Ann', 'ann@example.com', 'first-time-1');
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
