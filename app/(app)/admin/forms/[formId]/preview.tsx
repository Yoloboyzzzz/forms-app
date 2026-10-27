import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormFillView } from '@/components/FormFillView';
import { Button, EmptyState, Screen, Skeleton, Stack } from '@/components/primitives';
import { routes } from '@/constants/routes';
import { testIds } from '@/constants/testIds';
import { useFillForm } from '@/hooks/useFillForm';
import { useFormEditor } from '@/hooks/useFormEditor';
import type { FormDetail } from '@/types/models';

/** The form as respondents see it; nothing is saved. */
function PreviewBody({ detail, formId }: { detail: FormDetail; formId: string }) {
  const { t } = useTranslation();
  const fill = useFillForm({ preview: detail });
  const backToEditor = () => router.replace(routes.admin.formEdit(formId));

  if (fill.previewFinished) {
    return (
      <EmptyState
        title={t('fill.previewDone')}
        action={<Button label={t('fill.previewClose')} onPress={backToEditor} testID={testIds.fill.previewCloseButton} />}
        testID={testIds.fill.previewEnd}
      />
    );
  }
  if (fill.form === undefined || fill.section === undefined) {
    return (
      <Stack gap="sm" padding="md">
        <Skeleton height={120} radius="md" />
      </Stack>
    );
  }
  return (
    <>
      <Stack padding="md">
        <Button label={t('fill.previewClose')} variant="ghost" onPress={backToEditor} testID={testIds.fill.previewCloseButton} />
      </Stack>
      <FormFillView
        form={fill.form}
        section={fill.section}
        questions={fill.questions}
        answers={fill.answers}
        onChangeAnswer={fill.setAnswer}
        errors={fill.errors}
        position={fill.position}
        canGoBack={fill.canGoBack}
        isLastSection={fill.isLastSection}
        fileUpload={fill.fileUpload}
        imageUrls={fill.imageUrls}
        onNext={fill.next}
        onBack={fill.back}
        isPreview
        onConfirmSubmit={fill.cancelSubmit}
        onCancelSubmit={fill.cancelSubmit}
      />
    </>
  );
}

export default function FormPreviewScreen() {
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
        <Skeleton height={120} radius="md" />
      </Screen>
    );
  }
  return (
    <Screen padding="none">
      <PreviewBody detail={editor.detail} formId={formId} />
    </Screen>
  );
}
