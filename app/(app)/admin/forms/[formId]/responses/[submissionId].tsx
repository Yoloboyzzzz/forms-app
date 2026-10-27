import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Screen, Skeleton, Stack } from '@/components/primitives';
import { SubmissionDetail } from '@/components/SubmissionDetail';
import { routes } from '@/constants/routes';
import { testIds } from '@/constants/testIds';
import { useResponseDetail } from '@/hooks/useFormResponses';
import { questionsOfSection, sortedSections } from '@/utils/questions';

export default function ResponseDetailScreen() {
  const { t } = useTranslation();
  const { formId, submissionId } = useLocalSearchParams<{ formId: string; submissionId: string }>();
  const response = useResponseDetail(submissionId);

  function renderContent() {
    if (response.errorKey !== undefined) {
      return (
        <EmptyState
          title={t('responses.loadError')}
          description={t(response.errorKey)}
          action={<Button label={t('common.retry')} onPress={response.reload} />}
        />
      );
    }
    if (response.data === undefined || response.isLoading) {
      return (
        <Stack gap="sm">
          <Skeleton height={64} radius="md" />
          <Skeleton height={96} radius="md" />
        </Stack>
      );
    }
    const { detail, row, answers } = response.data;
    const questions = sortedSections(detail).flatMap((section) => questionsOfSection(detail, section.id));
    return <SubmissionDetail row={row} questions={questions} answers={answers} />;
  }

  return (
    <Screen padding="lg" testID={testIds.responses.detailScreen}>
      <Stack gap="md">
        <Button
          label={t('responses.backToList')}
          variant="ghost"
          onPress={() => router.replace(routes.admin.formResponses(formId))}
          testID={testIds.responses.detailBack}
        />
        {renderContent()}
      </Stack>
    </Screen>
  );
}
