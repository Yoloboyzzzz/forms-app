import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AssignmentList } from '@/components/AssignmentList';
import { Button, EmptyState, Screen, SegmentedControl, Skeleton, Stack, Text } from '@/components/primitives';
import { routes } from '@/constants/routes';
import { testIds } from '@/constants/testIds';
import { useMyForms } from '@/hooks/useMyForms';

export default function UserFormsScreen() {
  const { t } = useTranslation();
  const myForms = useMyForms();

  function renderContent() {
    if (!myForms.isLoaded && myForms.errorKey !== undefined) {
      return (
        <EmptyState
          title={t('myForms.loadError')}
          description={t(myForms.errorKey)}
          action={<Button label={t('common.retry')} onPress={myForms.reload} testID={testIds.userForms.retryButton} />}
          testID={testIds.userForms.loadError}
        />
      );
    }
    if (!myForms.isLoaded) {
      return (
        <Stack gap="sm" padding="md" testID={testIds.userForms.loading}>
          <Skeleton height={96} radius="md" />
          <Skeleton height={96} radius="md" />
        </Stack>
      );
    }
    if (myForms.items.length === 0) {
      return (
        <EmptyState
          title={myForms.tab === 'todo' ? t('myForms.emptyTodo') : t('myForms.emptySubmitted')}
          description={myForms.tab === 'todo' ? t('myForms.emptyTodoHint') : undefined}
          testID={testIds.userForms.empty}
        />
      );
    }
    return (
      <AssignmentList
        items={myForms.items}
        onPressItem={(item) => router.push(routes.user.fill(item.assignment.id))}
        onRefresh={myForms.reload}
        isRefreshing={myForms.isLoading}
        testID={testIds.userForms.list}
      />
    );
  }

  return (
    <Screen padding="none" scrollable={false} testID={testIds.userForms.screen}>
      <Stack padding="md" gap="md">
        <Text size="xl" weight="bold" heading>{t('myForms.title')}</Text>
        <SegmentedControl
          label={t('myForms.tabs')}
          value={myForms.tab}
          onChange={myForms.setTab}
          options={[
            { value: 'todo', label: t('myForms.todo'), testID: testIds.userForms.tabTodo },
            { value: 'submitted', label: t('myForms.submitted'), testID: testIds.userForms.tabSubmitted },
          ]}
        />
      </Stack>
      {renderContent()}
    </Screen>
  );
}
