import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIds } from '@/constants/testIds';
import type { PendingUserAction } from '@/hooks/useUsersScreen';
import type { Profile } from '@/types/models';
import { UserActionConfirmDialog } from './UserActionConfirmDialog';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const user: Profile = {
  id: 'u1',
  email: 'ann@example.com',
  fullName: 'Ann',
  role: 'user',
  mustChangePassword: false,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

function setup(action: PendingUserAction | undefined, props: Partial<React.ComponentProps<typeof UserActionConfirmDialog>> = {}) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  render(<UserActionConfirmDialog action={action} onConfirm={onConfirm} onCancel={onCancel} {...props} />);
  return { onConfirm, onCancel };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('UserActionConfirmDialog', () => {
  it('renders nothing without an action', () => {
    setup(undefined);
    expect(screen.queryByTestId(testIds.users.confirmDialog)).toBeNull();
  });

  it('asks to confirm a password reset', () => {
    setup({ kind: 'reset', user });
    expect(screen.getByText('Reset password?')).toBeTruthy();
    expect(screen.getByText(/Ann gets a new temporary password/)).toBeTruthy();
  });

  it('asks to confirm promoting to admin', () => {
    setup({ kind: 'role', user, role: 'admin' });
    expect(screen.getByText('Change role?')).toBeTruthy();
    expect(screen.getByText(/Ann becomes an admin/)).toBeTruthy();
  });

  it('asks to confirm demoting to user', () => {
    setup({ kind: 'role', user: { ...user, role: 'admin' }, role: 'user' });
    expect(screen.getByText(/Ann becomes a regular user/)).toBeTruthy();
  });

  it('uses the email when the name is empty', () => {
    setup({ kind: 'reset', user: { ...user, fullName: '' } });
    expect(screen.getByText(/ann@example.com gets a new temporary password/)).toBeTruthy();
  });

  it('confirms and cancels', () => {
    const { onConfirm, onCancel } = setup({ kind: 'reset', user });
    fireEvent.press(screen.getByTestId(`${testIds.users.confirmDialog}-confirm`));
    fireEvent.press(screen.getByTestId(`${testIds.users.confirmDialog}-cancel`));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows why confirming failed', () => {
    setup({ kind: 'reset', user }, { errorKey: 'errors.forbidden' });
    expect(screen.getByText(/You do not have access to this\./)).toBeTruthy();
  });

  it('blocks confirming while working', () => {
    const { onConfirm } = setup({ kind: 'reset', user }, { isWorking: true });
    fireEvent.press(screen.getByTestId(`${testIds.users.confirmDialog}-confirm`));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
