import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import type { Profile } from '@/types/models';
import { UserList } from './UserList';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

function user(id: string, role: Profile['role'] = 'user'): Profile {
  return {
    id,
    email: `${id}@example.com`,
    fullName: id,
    role,
    mustChangePassword: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('UserList', () => {
  it('renders one item per user, keyed by id', () => {
    render(
      <UserList
        users={[user('u1'), user('u2')]}
        onResetPassword={jest.fn()}
        onChangeRole={jest.fn()}
        testID="list"
      />,
    );
    expect(screen.getByTestId(testIdFor.userListItem('u1'))).toBeTruthy();
    expect(screen.getByTestId(testIdFor.userListItem('u2'))).toBeTruthy();
  });

  it('hides actions for the current user only', () => {
    render(
      <UserList users={[user('u1'), user('u2')]} currentUserId="u1" onResetPassword={jest.fn()} onChangeRole={jest.fn()} />,
    );
    expect(screen.queryByTestId(testIdFor.userResetButton('u1'))).toBeNull();
    expect(screen.getByTestId(testIdFor.userResetButton('u2'))).toBeTruthy();
  });

  it('passes the chosen user to the handlers', () => {
    const onResetPassword = jest.fn();
    const onChangeRole = jest.fn();
    const target = user('u2');
    render(<UserList users={[user('u1'), target]} onResetPassword={onResetPassword} onChangeRole={onChangeRole} />);

    fireEvent.press(screen.getByTestId(testIdFor.userResetButton('u2')));
    fireEvent.press(screen.getByTestId(testIdFor.userRoleButton('u2')));

    expect(onResetPassword).toHaveBeenCalledWith(target);
    expect(onChangeRole).toHaveBeenCalledWith(target);
  });

  it('supports pull to refresh', () => {
    const onRefresh = jest.fn();
    render(
      <UserList
        users={[user('u1')]}
        onResetPassword={jest.fn()}
        onChangeRole={jest.fn()}
        onRefresh={onRefresh}
        isRefreshing
        testID="list"
      />,
    );
    const list = screen.getByTestId('list');
    expect(list.props.refreshControl.props.refreshing).toBe(true);
    list.props.refreshControl.props.onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
