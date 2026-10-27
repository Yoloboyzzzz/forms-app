import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { AnswerValue, Question, ResponseRow } from '@/types/models';
import { describeAnswer } from '@/utils/responseSummary';
import { formatDateTime } from '@/utils/formatDate';
import { Badge, Card, Row, Stack, Text } from './primitives';

interface SubmissionDetailProps {
  row: ResponseRow;
  /** The form's questions in order. */
  questions: Question[];
  answers: Record<string, AnswerValue>;
}

/** One person's response: who, when, and every question with the answer given. */
export function SubmissionDetail({ row, questions, answers }: SubmissionDetailProps) {
  const { t, i18n } = useTranslation();
  const status = row.submission?.status ?? 'draft';

  return (
    <Stack gap="md">
      <Stack gap="sm">
        <Row justify="space-between" gap="md">
          <Text size="xl" weight="bold" heading>
            {t('responses.detailTitle', { name: row.user.fullName || row.user.email })}
          </Text>
          <Badge label={t(`responses.status.${status}`)} variant={status === 'submitted' ? 'success' : 'warning'} />
        </Row>
        <Text color="muted">{row.user.email}</Text>
        {row.submission?.submittedAt !== undefined && (
          <Text size="sm" color="muted">
            {t('responses.submittedOn', { date: formatDateTime(row.submission.submittedAt, i18n.language) })}
          </Text>
        )}
      </Stack>
      {questions.map((question) => {
        const text = describeAnswer(question, answers[question.id], t('fill.other'));
        return (
          <Card key={question.id} testID={testIdFor.detailAnswer(question.id)}>
            <Stack gap="sm" padding="md">
              <Text weight="bold">
                {question.title}
                {question.isActive ? '' : ` ${t('responses.deactivatedQuestion')}`}
              </Text>
              <Text color={text === '' ? 'muted' : 'default'}>{text === '' ? t('responses.unanswered') : text}</Text>
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
