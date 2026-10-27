import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Screen, SegmentedControl, Skeleton, Stack, Text } from '@/components/primitives';
import { ResponseList } from '@/components/ResponseList';
import { ResponseSummary } from '@/components/ResponseSummary';
import { routes } from '@/constants/routes';
import { testIds } from '@/constants/testIds';
import { useFormResponses } from '@/hooks/useFormResponses';
import { sortedSections, questionsOfSection } from '@/utils/questions';

type Tab = 'summary' | 'list';

export default function FormResponsesScreen() {
  const { t } = useTranslation();
  const { formId } = useLocalSearchParams<{ formId: string }>();
  const responses = useFormResponses(formId);
  const [tab, setTab] = useState<Tab>('summary');

  function renderContent() {
    if (responses.errorKey !== undefined) {
      return (
        <EmptyState
          title={t('responses.loadError')}
          description={t(responses.errorKey)}
          action={<Button label={t('common.retry')} onPress={responses.reload} testID={testIds.responses.retryButton} />}
          testID={testIds.responses.loadError}
        />
      );
    }
    if (responses.data === undefined || responses.isLoading) {
      return (
        <Stack gap="sm" padding="md" testID={testIds.responses.loading}>
          <Skeleton height={96} radius="md" />
          <Skeleton height={96} radius="md" />
        </Stack>
      );
    }
    const { detail, rows, answers } = responses.data;
    if (rows.length === 0) {
      return <EmptyState title={t('responses.empty')} testID={testIds.responses.empty} />;
    }
    if (tab === 'list') {
      return (
        <ResponseList
          rows={rows}
          onOpen={(row) => row.submission && router.push(routes.admin.submission(formId, row.submission.id))}
        />
      );
    }
    const orderedQuestions = sortedSections(detail).flatMap((section) => questionsOfSection(detail, section.id));
    return <ResponseSummary questions={orderedQuestions} answers={answers} />;
  }

  const submitted = responses.data?.rows.filter((row) => row.submission?.status === 'submitted').length ?? 0;

  return (
    <Screen padding="none" scrollable={tab === 'summary'} testID={testIds.responses.screen}>
      <Stack padding="md" gap="md">
        <Button
          label={t('responses.back')}
          variant="ghost"
          onPress={() => router.replace(routes.admin.formEdit(formId))}
          testID={testIds.responses.backButton}
        />
        <Text size="xl" weight="bold" heading>{t('responses.title')}</Text>
        {responses.data !== undefined && (
          <Text color="muted" testID={testIds.responses.counts}>
            {t('responses.submittedOf', { submitted, total: responses.data.rows.length })}
          </Text>
        )}
        <SegmentedControl
          label={t('responses.tabs')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'summary', label: t('responses.tabSummary'), testID: testIds.responses.tabSummary },
            { value: 'list', label: t('responses.tabList'), testID: testIds.responses.tabList },
          ]}
        />
      </Stack>
      {renderContent()}
    </Screen>
  );
}
