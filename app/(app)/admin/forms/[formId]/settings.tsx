import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormSettingsPanel } from '@/components/FormSettingsPanel';
import { Button, EmptyState, Screen, Skeleton, Stack } from '@/components/primitives';
import { SaveIndicator } from '@/components/SaveIndicator';
import { routes } from '@/constants/routes';
import { testIds } from '@/constants/testIds';
import { useFormEditor } from '@/hooks/useFormEditor';

export default function FormSettingsScreen() {
  const { t } = useTranslation();
  const { formId } = useLocalSearchParams<{ formId: string }>();
  const editor = useFormEditor(formId);

  if (editor.errorKey !== undefined) {
    return (
      <Screen>
        <EmptyState
          title={t('editor.loadError')}
          description={t(editor.errorKey)}
          action={<Button label={t('common.retry')} onPress={editor.reload} />}
        />
      </Screen>
    );
  }
  if (editor.detail === undefined || editor.isLoading) {
    return (
      <Screen>
        <Stack gap="sm">
          <Skeleton height={48} radius="md" />
          <Skeleton height={48} radius="md" />
          <Skeleton height={48} radius="md" />
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen padding="lg">
      <Stack gap="lg">
        <Button
          label={t('settings.back')}
          variant="ghost"
          onPress={() => router.replace(routes.admin.formEdit(formId))}
          testID={testIds.settings.backButton}
        />
        <SaveIndicator state={editor.saveState} errorKey={editor.saveErrorKey} onRetry={editor.retrySave} />
        <FormSettingsPanel form={editor.detail.form} onChange={editor.changeForm} />
      </Stack>
    </Screen>
  );
}
