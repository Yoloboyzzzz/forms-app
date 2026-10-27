import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor, testIds } from '@/constants/testIds';
import type { Profile } from '@/types/models';
import { ProfileView } from './ProfileView';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const ids = testIds.profile;

const profile: Profile = {
  id: 'u1',
  email: 'ann@example.com',
  fullName: 'Ann',
  role: 'admin',
  mustChangePassword: false,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

function setup(props: Partial<React.ComponentProps<typeof ProfileView>> = {}) {
  const handlers = {
    onChangeLanguage: jest.fn(),
    onSaveName: jest.fn(),
    onChangePassword: jest.fn(),
    onLogout: jest.fn(),
  };
  render(<ProfileView profile={profile} language="en" {...handlers} {...props} />);
  return handlers;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('ProfileView', () => {
  it('shows email and role', () => {
    setup();
    expect(screen.getByTestId(ids.emailText)).toHaveTextContent('ann@example.com');
    expect(screen.getByText('Admin')).toBeTruthy();
  });

  it('saves a changed name', () => {
    const { onSaveName } = setup();
    fireEvent.changeText(screen.getByTestId(ids.nameInput), 'Anna');
    fireEvent.press(screen.getByTestId(ids.saveNameButton));
    expect(onSaveName).toHaveBeenCalledWith('Anna');
  });

  it('cannot save an unchanged name', () => {
    const { onSaveName } = setup();
    fireEvent.press(screen.getByTestId(ids.saveNameButton));
    expect(onSaveName).not.toHaveBeenCalled();
  });

  it('rejects an empty name inline', () => {
    const { onSaveName } = setup();
    fireEvent.changeText(screen.getByTestId(ids.nameInput), '  ');
    fireEvent.press(screen.getByTestId(ids.saveNameButton));
    expect(onSaveName).not.toHaveBeenCalled();
    expect(screen.getByTestId(`${ids.nameInput}-error`)).toHaveTextContent('This field is required.');
  });

  it('shows a server error for the name', () => {
    setup({ nameErrorKey: 'errors.network' });
    expect(screen.getByTestId(`${ids.nameInput}-error`)).toHaveTextContent('No connection. Check your internet and try again.');
  });

  it('confirms a saved name', () => {
    setup({ nameSaved: true });
    expect(screen.getByTestId(ids.nameSavedMessage)).toHaveTextContent('Your name has been saved.');
  });

  it('does not show confirmations by default', () => {
    setup();
    expect(screen.queryByTestId(ids.nameSavedMessage)).toBeNull();
    expect(screen.queryByTestId(ids.passwordSavedMessage)).toBeNull();
  });

  it('switches language', () => {
    const { onChangeLanguage } = setup();
    fireEvent.press(screen.getByTestId(testIdFor.languageOption('nl')));
    expect(onChangeLanguage).toHaveBeenCalledWith('nl');
  });

  it('opens and closes the voluntary password form', () => {
    setup();
    expect(screen.queryByTestId(testIds.changePassword.newPasswordInput)).toBeNull();
    fireEvent.press(screen.getByTestId(ids.changePasswordToggle));
    expect(screen.getByTestId(testIds.changePassword.newPasswordInput)).toBeTruthy();
    expect(screen.queryByTestId(testIds.changePassword.logoutButton)).toBeNull();
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByTestId(testIds.changePassword.newPasswordInput)).toBeNull();
  });

  it('changes the password from the form', () => {
    const { onChangePassword } = setup();
    fireEvent.press(screen.getByTestId(ids.changePasswordToggle));
    fireEvent.changeText(screen.getByTestId(testIds.changePassword.newPasswordInput), 'new-secret-1');
    fireEvent.changeText(screen.getByTestId(testIds.changePassword.confirmPasswordInput), 'new-secret-1');
    fireEvent.press(screen.getByTestId(testIds.changePassword.submitButton));
    expect(onChangePassword).toHaveBeenCalledWith('new-secret-1');
  });

  it('confirms a changed password', () => {
    setup({ passwordChanged: true });
    expect(screen.getByTestId(ids.passwordSavedMessage)).toHaveTextContent('Your password has been changed.');
  });

  it('logs out', () => {
    const { onLogout } = setup();
    fireEvent.press(screen.getByTestId(ids.logoutButton));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
