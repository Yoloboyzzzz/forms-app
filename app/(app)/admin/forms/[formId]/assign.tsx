import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AssignUserList } from '@/components/AssignUserList';
import { Button, ConfirmDialog, EmptyState, Screen, Skeleton, Stack, Text, Toast } from '@/components/primitives';
import { routes } from '@/constants/routes';
import { testIds } from '@/constants/testIds';
import { useAssignForm } from '@/hooks/useAssignForm';

export default function AssignFormScreen() {
  const { t } = useTranslation();
  const { formId } = useLocalSearchParams<{ formId: string }>();
  const assign = useAssignForm(formId);
  const targetName = assign.unassignTarget?.user.fullName || assign.unassignTarget?.user.email || '';

  function renderContent() {
    if (assign.errorKey !== undefined && !assign.isLoaded) {
      return (
        <EmptyState
          title={t('assign.loadError')}
          description={t(assign.errorKey)}
          action={<Button label={t('common.retry')} onPress={assign.reload} testID={testIds.assign.retryButton} />}
          testID={testIds.assign.loadError}
        />
      );
    }
    if (!assign.isLoaded) {
      return (
        <Stack gap="sm" padding="md">
          <Skeleton height={64} radius="md" />
          <Skeleton height={64} radius="md" />
        </Stack>
      );
    }
    return (
      <AssignUserList
        assignees={assign.assignees}
        candidates={assign.candidates}
        totalCandidates={assign.totalCandidates}
        selectedIds={assign.selectedIds}
        onToggle={assign.toggle}
        query={assign.query}
        onQueryChange={assign.setQuery}
        dueDateText={assign.dueDateText}
        onDueDateChange={assign.setDueDateText}
        dueDateInvalid={assign.dueDateInvalid}
        onSubmit={() => void assign.submit()}
        onUnassign={assign.requestUnassign}
        isSubmitting={assign.isSubmitting}
      />
    );
  }

  const messageKey = assign.actionErrorKey ?? (assign.justAssigned ? 'assign.done' : undefined);

  return (
    <Screen padding="none" scrollable={false} testID={testIds.assign.screen}>
      <Stack padding="md" gap="sm">
        <Button
          label={t('assign.back')}
          variant="ghost"
          onPress={() => router.replace(routes.admin.formEdit(formId))}
          testID={testIds.assign.backButton}
        />
        <Text size="xl" weight="bold" heading>{t('assign.title')}</Text>
      </Stack>
      {renderContent()}
      <ConfirmDialog
        visible={assign.unassignTarget !== undefined}
        title={t('assign.unassignTitle', { name: targetName })}
        message={t('assign.unassignMessage', { name: targetName })}
        confirmLabel={t('assign.unassign')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => void assign.confirmUnassign()}
        onCancel={assign.cancelUnassign}
        testID={testIds.assign.unassignDialog}
      />
      <Toast
        message={messageKey === undefined ? '' : t(messageKey)}
        variant={assign.actionErrorKey === undefined ? 'success' : 'error'}
        visible={messageKey !== undefined}
        testID={testIds.assign.notice}
      />
    </Screen>
  );
}
