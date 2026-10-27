import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FormFillView } from '@/components/FormFillView';
import { Button, EmptyState, Screen, Skeleton, Stack } from '@/components/primitives';
import { routes } from '@/constants/routes';
import { testIds } from '@/constants/testIds';
import { useFillForm } from '@/hooks/useFillForm';

export default function FillFormScreen() {
  const { t } = useTranslation();
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const fill = useFillForm({ assignmentId });
  const { isSubmitted } = fill;

  // A submitted response is shown on the confirmation page; it offers editing when the form allows it.
  useEffect(() => {
    if (isSubmitted) router.replace(routes.user.done(assignmentId));
  }, [isSubmitted, assignmentId]);

  function renderContent() {
    if (fill.errorKey !== undefined) {
      return fill.errorKey === 'errors.notFound' ? (
        <EmptyState
          title={t('fill.notFoundTitle')}
          description={t('fill.notFoundMessage')}
          action={<Button label={t('fill.backToForms')} onPress={() => router.replace(routes.user.forms)} testID={testIds.fill.backToFormsButton} />}
          testID={testIds.fill.notFound}
        />
      ) : (
        <EmptyState
          title={t('fill.loadError')}
          description={t(fill.errorKey)}
          action={<Button label={t('common.retry')} onPress={fill.reload} testID={testIds.fill.retryButton} />}
          testID={testIds.fill.loadError}
        />
      );
    }
    if (fill.form === undefined || fill.section === undefined || fill.isLoading) {
      return (
        <Stack gap="sm" padding="md" testID={testIds.fill.loading}>
          <Skeleton height={32} radius="md" />
          <Skeleton height={120} radius="md" />
          <Skeleton height={120} radius="md" />
        </Stack>
      );
    }
    if (fill.isClosed) {
      return (
        <EmptyState
          title={t('fill.closedTitle')}
          description={t('fill.closedMessage')}
          action={<Button label={t('fill.backToForms')} onPress={() => router.replace(routes.user.forms)} testID={testIds.fill.backToFormsButton} />}
          testID={testIds.fill.closed}
        />
      );
    }
    return (
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
        onNext={fill.next}
        onBack={fill.back}
        isOnline={fill.isOnline}
        isSubmitting={fill.isSubmitting}
        saveState={fill.saveState}
        saveErrorKey={fill.saveErrorKey}
        onRetrySave={fill.retrySave}
        isConfirming={fill.isConfirming}
        onConfirmSubmit={() => void fill.confirmSubmit()}
        onCancelSubmit={fill.cancelSubmit}
        submitErrorKey={fill.submitErrorKey}
      />
    );
  }

  return <Screen padding="none">{renderContent()}</Screen>;
}
