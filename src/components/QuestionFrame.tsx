import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { Question } from '@/types/models';
import { Icon, Row, Stack, Text } from './primitives';

interface QuestionFrameProps {
  question: Question;
  /** Translated error under the answer. */
  errorText?: string;
  children: React.ReactNode;
}

/** Title (with a required mark), description, the answer field and its error. */
export function QuestionFrame({ question, errorText, children }: QuestionFrameProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="sm" testID={testIdFor.question(question.id)}>
      <Row gap="sm" align="flex-start" wrap>
        <Text weight="bold" heading>{question.title}</Text>
        {question.isRequired && (
          <Text weight="bold" color="error" accessibilityLabel={t('fill.requiredMark')}>*</Text>
        )}
      </Row>
      {question.description !== undefined && question.description !== '' && (
        <Text size="sm" color="muted">{question.description}</Text>
      )}
      {children}
      {errorText !== undefined && (
        <Row gap="sm">
          <Icon name="alert-circle" size={16} color="error" />
          <Text size="sm" color="error" live testID={testIdFor.questionError(question.id)}>{errorText}</Text>
        </Row>
      )}
    </Stack>
  );
}
