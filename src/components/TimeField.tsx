import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { AnswerValue, TimeQuestion } from '@/types/models';
import { readText } from '@/utils/answers';
import { parseTimeAnswer, timePlaceholder } from '@/utils/timeAnswer';
import { QuestionFrame } from './QuestionFrame';
import { InputField } from './primitives';

interface TimeFieldProps {
  question: TimeQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue | undefined) => void;
  errorText?: string;
}

/** A time of day ("14:30") or a duration ("01:15:00"), typed as text until native pickers arrive. */
export function TimeField({ question, value, onChange, errorText }: TimeFieldProps) {
  const { t } = useTranslation();
  const isDuration = question.settings.isDuration ?? false;
  const pattern = timePlaceholder(isDuration);
  const [text, setText] = useState(() => readText(value));
  const [invalid, setInvalid] = useState(false);

  function change(next: string): void {
    setText(next);
    const result = parseTimeAnswer(next, isDuration);
    setInvalid(result.status === 'invalid');
    if (result.status === 'ok') onChange(result.value);
    if (result.status === 'empty') onChange(undefined);
  }

  return (
    <QuestionFrame question={question} errorText={errorText}>
      <InputField
        label={question.title}
        hideLabel
        value={text}
        onChangeText={change}
        placeholder={pattern}
        keyboardType="numbers-and-punctuation"
        error={invalid ? t('fill.timeInvalid', { pattern }) : undefined}
        testID={testIdFor.questionInput(question.id)}
      />
    </QuestionFrame>
  );
}
