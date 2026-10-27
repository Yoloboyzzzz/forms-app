import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { AnswerValue, Question, ResponseRow } from '@/types/models';
import { describeAnswer } from '@/utils/responseSummary';
import { fileNameOf } from '@/utils/uploads';
import { formatDateTime } from '@/utils/formatDate';
import { Badge, Button, Card, Row, Stack, Text } from './primitives';

interface SubmissionDetailProps {
  row: ResponseRow;
  /** The form's questions in order. */
  questions: Question[];
  answers: Record<string, AnswerValue>;
  /** Opens an uploaded file; without it file names are shown as plain text. */
  onOpenFile?: (path: string) => void;
}

/** One person's response: who, when, and every question with the answer given. */
export function SubmissionDetail({ row, questions, answers, onOpenFile }: SubmissionDetailProps) {
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
        const answer = answers[question.id];
        const files = question.questionType === 'file_upload' && Array.isArray(answer) ? answer : [];
        return (
          <Card key={question.id} testID={testIdFor.detailAnswer(question.id)}>
            <Stack gap="sm" padding="md">
              <Text weight="bold">
                {question.title}
                {question.isActive ? '' : ` ${t('responses.deactivatedQuestion')}`}
              </Text>
              {files.length > 0 && onOpenFile !== undefined ? (
                files.map((path) => (
                  <Button
                    key={path}
                    label={t('responses.openFile', { name: fileNameOf(path) })}
                    variant="secondary"
                    onPress={() => onOpenFile(path)}
                    testID={testIdFor.openFile(question.id, path)}
                  />
                ))
              ) : (
                <Text color={text === '' ? 'muted' : 'default'}>{text === '' ? t('responses.unanswered') : text}</Text>
              )}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
