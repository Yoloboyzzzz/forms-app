import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { Profile } from '@/types/models';
import { Avatar, Badge, Button, Card, Row, Stack, Text } from './primitives';

interface UserListItemProps {
  user: Profile;
  /** The signed-in admin: resetting their own password or role would lock them out, so no actions are offered. */
  isSelf?: boolean;
  onResetPassword: (user: Profile) => void;
  onChangeRole: (user: Profile) => void;
}

export function UserListItem({ user, isSelf = false, onResetPassword, onChangeRole }: UserListItemProps) {
  const { t } = useTranslation();
  const testID = testIdFor.userListItem(user.id);

  return (
    <Card testID={testID}>
      <Stack gap="sm" padding="md">
        <Row gap="md">
          <Avatar name={user.fullName === '' ? user.email : user.fullName} />
          <Stack flex={1}>
            <Text weight="bold" numberOfLines={1}>
              {user.fullName === '' ? user.email : user.fullName}
              {isSelf ? ` ${t('users.you')}` : ''}
            </Text>
            <Text size="sm" color="muted" numberOfLines={1}>{user.email}</Text>
          </Stack>
          <Badge label={t(`role.${user.role}`)} variant={user.role === 'admin' ? 'warning' : 'default'} />
        </Row>
        {user.mustChangePassword && <Text size="sm" color="muted">{t('users.mustChangePassword')}</Text>}
        {!isSelf && (
          <Row gap="sm" wrap>
            <Button
              label={t('users.resetPassword')}
              variant="secondary"
              onPress={() => onResetPassword(user)}
              testID={testIdFor.userResetButton(user.id)}
            />
            <Button
              label={user.role === 'admin' ? t('users.makeUser') : t('users.makeAdmin')}
              variant="secondary"
              onPress={() => onChangeRole(user)}
              testID={testIdFor.userRoleButton(user.id)}
            />
          </Row>
        )}
      </Stack>
    </Card>
  );
}
