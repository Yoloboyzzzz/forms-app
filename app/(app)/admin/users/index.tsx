import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Row, Screen, Skeleton, Stack, Text } from '@/components/primitives';
import { TemporaryPasswordDialog } from '@/components/TemporaryPasswordDialog';
import { UserActionConfirmDialog } from '@/components/UserActionConfirmDialog';
import { UserList } from '@/components/UserList';
import { routes } from '@/constants/routes';
import { testIds } from '@/constants/testIds';
import { useUsersScreen } from '@/hooks/useUsersScreen';

export default function AdminUsersScreen() {
  const { t } = useTranslation();
  const users = useUsersScreen();

  function renderContent() {
    if (!users.isLoaded && users.errorKey !== undefined) {
      return (
        <EmptyState
          title={t('users.loadError')}
          description={t(users.errorKey)}
          action={<Button label={t('common.retry')} onPress={users.reload} testID={testIds.users.retryButton} />}
          testID={testIds.users.loadError}
        />
      );
    }
    if (!users.isLoaded) {
      return (
        <Stack gap="sm" padding="md" testID={testIds.users.loading}>
          <Skeleton height={96} radius="md" />
          <Skeleton height={96} radius="md" />
          <Skeleton height={96} radius="md" />
        </Stack>
      );
    }
    if (users.users.length === 0) {
      return <EmptyState title={t('users.empty')} testID={testIds.users.empty} />;
    }
    return (
      <UserList
        users={users.users}
        currentUserId={users.currentUserId}
        onResetPassword={users.requestReset}
        onChangeRole={users.requestRoleChange}
        onRefresh={users.reload}
        isRefreshing={users.isLoading}
        testID={testIds.users.list}
      />
    );
  }

  return (
    <Screen padding="none" scrollable={false} testID={testIds.users.screen}>
      <Stack padding="md" gap="sm">
        <Row justify="space-between" gap="md">
          <Text size="xl" weight="bold" heading>{t('users.title')}</Text>
          <Button
            label={t('users.newUser')}
            onPress={() => router.push(routes.admin.newUser)}
            testID={testIds.users.newButton}
          />
        </Row>
      </Stack>
      {renderContent()}
      <UserActionConfirmDialog
        action={users.pending}
        isWorking={users.isWorking}
        errorKey={users.actionErrorKey}
        onConfirm={() => void users.confirmPending()}
        onCancel={users.cancelPending}
      />
      <TemporaryPasswordDialog
        visible={users.issuedPassword !== undefined}
        userName={users.issuedPassword?.userName ?? ''}
        password={users.issuedPassword?.password ?? ''}
        reason="reset"
        copied={users.passwordCopied}
        onCopy={users.copyPassword}
        onClose={users.dismissPassword}
      />
    </Screen>
  );
}
