import { useTranslation } from 'react-i18next';
import { testIdFor, testIds } from '@/constants/testIds';
import type { Question, ResponseAnswer } from '@/types/models';
import { percentage, summarizeResponses, type QuestionSummary } from '@/utils/responseSummary';
import { Card, ProgressBar, Row, Stack, Text } from './primitives';

interface ResponseSummaryProps {
  questions: Question[];
  answers: ResponseAnswer[];
}

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const share = percentage(count, total);
  return (
    <Stack gap="sm">
      <Row justify="space-between" gap="md">
        <Text numberOfLines={2}>{label}</Text>
        <Text color="muted">{`${count} (${share}%)`}</Text>
      </Row>
      <ProgressBar value={share / 100} label={`${label}: ${share}%`} />
    </Stack>
  );
}

function SummaryBody({ summary }: { summary: QuestionSummary }) {
  const { t } = useTranslation();

  switch (summary.kind) {
    case 'choice':
      return (
        <Stack gap="md">
          {summary.counts.map((entry) => (
            <Bar key={entry.id} label={entry.label} count={entry.count} total={summary.total} />
          ))}
          {summary.otherAnswers.length > 0 && (
            <Stack gap="sm">
              <Text size="sm" weight="medium">{t('responses.otherAnswers')}</Text>
              {summary.otherAnswers.map((text, index) => (
                <Text key={`${index}-${text}`} color="muted">{text}</Text>
              ))}
            </Stack>
          )}
        </Stack>
      );
    case 'scale':
      return (
        <Stack gap="md">
          {summary.average !== undefined && (
            <Text weight="medium">{t('responses.average', { value: summary.average.toFixed(1) })}</Text>
          )}
          {summary.counts.map((entry) => (
            <Bar key={entry.value} label={String(entry.value)} count={entry.count} total={summary.total} />
          ))}
        </Stack>
      );
    case 'text':
      return (
        <Stack gap="sm">
          {summary.answers.map((text, index) => (
            <Text key={`${index}-${text}`}>{text}</Text>
          ))}
        </Stack>
      );
    case 'none':
      return <Text color="muted">{t('responses.noSummary')}</Text>;
  }
}

/** Per question: how often each option was picked, scale averages, or the typed answers. */
export function ResponseSummary({ questions, answers }: ResponseSummaryProps) {
  const { t } = useTranslation();
  const summaries = summarizeResponses(questions, answers);

  return (
    <Stack gap="md" padding="md" testID={testIds.responses.summary}>
      {summaries.map((summary) => (
        <Card key={summary.question.id} testID={testIdFor.summary(summary.question.id)}>
          <Stack gap="md" padding="md">
            <Text weight="bold">{summary.question.title}</Text>
            {summary.kind !== 'none' && (
              <Text size="sm" color="muted">{t('responses.answers', { count: summary.total })}</Text>
            )}
            <SummaryBody summary={summary} />
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
