import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import type { Profile } from '@/types/models';
import { UserListItem } from './UserListItem';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

function user(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'u1',
    email: 'ann@example.com',
    fullName: 'Ann',
    role: 'user',
    mustChangePassword: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

function setup(profile: Profile, isSelf = false) {
  const onResetPassword = jest.fn();
  const onChangeRole = jest.fn();
  render(<UserListItem user={profile} isSelf={isSelf} onResetPassword={onResetPassword} onChangeRole={onChangeRole} />);
  return { onResetPassword, onChangeRole };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('UserListItem', () => {
  it('shows name, email and role', () => {
    setup(user());
    expect(screen.getByText('Ann')).toBeTruthy();
    expect(screen.getByText('ann@example.com')).toBeTruthy();
    expect(screen.getByText('User')).toBeTruthy();
  });

  it('falls back to the email when the name is empty', () => {
    setup(user({ fullName: '' }));
    expect(screen.getAllByText('ann@example.com').length).toBeGreaterThan(0);
  });

  it('flags accounts that still have a first-time password', () => {
    setup(user({ mustChangePassword: true }));
    expect(screen.getByText('Still has to change password')).toBeTruthy();
  });

  it('does not flag accounts with an active password', () => {
    setup(user());
    expect(screen.queryByText('Still has to change password')).toBeNull();
  });

  it('resets the password of that user', () => {
    const profile = user();
    const { onResetPassword } = setup(profile);
    fireEvent.press(screen.getByTestId(testIdFor.userResetButton('u1')));
    expect(onResetPassword).toHaveBeenCalledWith(profile);
  });

  it('offers to make a user an admin, and an admin a user', () => {
    const { onChangeRole } = setup(user());
    fireEvent.press(screen.getByTestId(testIdFor.userRoleButton('u1')));
    expect(onChangeRole).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Make admin')).toBeTruthy();
  });

  it('labels the role action for admins', () => {
    setup(user({ role: 'admin' }));
    expect(screen.getByText('Make user')).toBeTruthy();
    expect(screen.getByText('Admin')).toBeTruthy();
  });

  it('offers no actions on the signed-in admin themselves', () => {
    setup(user({ role: 'admin' }), true);
    expect(screen.queryByTestId(testIdFor.userResetButton('u1'))).toBeNull();
    expect(screen.queryByTestId(testIdFor.userRoleButton('u1'))).toBeNull();
    expect(screen.getByText(/\(you\)/)).toBeTruthy();
  });
});
