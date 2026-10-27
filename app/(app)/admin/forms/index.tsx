import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormList } from '@/components/FormList';
import { Button, EmptyState, Row, Screen, Skeleton, Stack, Text } from '@/components/primitives';
import { StatusFilter } from '@/components/StatusFilter';
import { routes } from '@/constants/routes';
import { testIds } from '@/constants/testIds';
import { useAdminForms } from '@/hooks/useAdminForms';

export default function AdminFormsScreen() {
  const { t } = useTranslation();
  const forms = useAdminForms();

  function renderContent() {
    if (!forms.isLoaded && forms.errorKey !== undefined) {
      return (
        <EmptyState
          title={t('forms.loadError')}
          description={t(forms.errorKey)}
          action={<Button label={t('common.retry')} onPress={forms.reload} testID={testIds.adminForms.retryButton} />}
          testID={testIds.adminForms.loadError}
        />
      );
    }
    if (!forms.isLoaded) {
      return (
        <Stack gap="sm" padding="md" testID={testIds.adminForms.loading}>
          <Skeleton height={96} radius="md" />
          <Skeleton height={96} radius="md" />
          <Skeleton height={96} radius="md" />
        </Stack>
      );
    }
    if (forms.forms.length === 0) {
      return (
        <EmptyState
          title={forms.filter === 'all' ? t('forms.empty') : t('forms.emptyFiltered')}
          description={forms.filter === 'all' ? t('forms.emptyHint') : undefined}
          testID={testIds.adminForms.empty}
        />
      );
    }
    return (
      <FormList
        forms={forms.forms}
        onPressForm={(form) => router.push(routes.admin.formEdit(form.id))}
        onRefresh={forms.reload}
        isRefreshing={forms.isLoading}
        testID={testIds.adminForms.list}
      />
    );
  }

  return (
    <Screen padding="none" scrollable={false} testID={testIds.adminForms.screen}>
      <Stack padding="md" gap="md">
        <Row justify="space-between" gap="md">
          <Text size="xl" weight="bold" heading>{t('forms.title')}</Text>
          <Button
            label={t('forms.newForm')}
            onPress={() => router.push(routes.admin.newForm)}
            testID={testIds.adminForms.newButton}
          />
        </Row>
        <StatusFilter value={forms.filter} onChange={forms.setFilter} />
      </Stack>
      {renderContent()}
    </Screen>
  );
}
