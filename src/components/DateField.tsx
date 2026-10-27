import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { AnswerValue, DateQuestion } from '@/types/models';
import { readText } from '@/utils/answers';
import { datePlaceholder, formatDateAnswer, parseDateAnswer, type DateAnswerFormat } from '@/utils/dateAnswer';
import { QuestionFrame } from './QuestionFrame';
import { InputField } from './primitives';

interface DateFieldProps {
  question: DateQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue | undefined) => void;
  errorText?: string;
}

/**
 * A date (and optionally time) typed as text. Web and native date pickers replace the text input in the
 * native phase of the plan; the stored value stays the same.
 */
export function DateField({ question, value, onChange, errorText }: DateFieldProps) {
  const { t } = useTranslation();
  const format: DateAnswerFormat = {
    includeYear: question.settings.includeYear ?? true,
    includeTime: question.settings.includeTime ?? false,
  };
  const [text, setText] = useState(() => formatDateAnswer(readText(value), format));
  const [invalid, setInvalid] = useState(false);
  const pattern = datePlaceholder(format);

  function change(next: string): void {
    setText(next);
    const result = parseDateAnswer(next, format);
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
        error={invalid ? t('fill.dateInvalid', { pattern }) : undefined}
        testID={testIdFor.questionInput(question.id)}
      />
    </QuestionFrame>
  );
}
