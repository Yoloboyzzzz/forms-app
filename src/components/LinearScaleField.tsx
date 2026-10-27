import { testIdFor } from '@/constants/testIds';
import type { AnswerValue, LinearScaleQuestion } from '@/types/models';
import { readNumber } from '@/utils/answers';
import { QuestionFrame } from './QuestionFrame';
import { Button, Row, Stack, Text } from './primitives';

interface LinearScaleFieldProps {
  question: LinearScaleQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue | undefined) => void;
  errorText?: string;
}

/** Choose a number on a scale, with optional labels at both ends. */
export function LinearScaleField({ question, value, onChange, errorText }: LinearScaleFieldProps) {
  const min = question.settings.min ?? 1;
  const max = question.settings.max ?? 5;
  const selected = readNumber(value);
  const numbers = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  return (
    <QuestionFrame question={question} errorText={errorText}>
      <Stack gap="sm">
        <Row gap="sm" wrap>
          {numbers.map((number) => (
            <Button
              key={number}
              label={String(number)}
              variant={number === selected ? 'primary' : 'secondary'}
              onPress={() => onChange(number)}
              testID={testIdFor.questionScaleValue(question.id, number)}
            />
          ))}
        </Row>
        {(question.settings.minLabel !== undefined || question.settings.maxLabel !== undefined) && (
          <Row justify="space-between" gap="md">
            <Text size="sm" color="muted">{question.settings.minLabel ?? ''}</Text>
            <Text size="sm" color="muted" align="right">{question.settings.maxLabel ?? ''}</Text>
          </Row>
        )}
      </Stack>
    </QuestionFrame>
  );
}
