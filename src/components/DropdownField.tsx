import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { AnswerValue, DropdownQuestion } from '@/types/models';
import { readChoice } from '@/utils/answers';
import { orderedOptions } from '@/utils/options';
import { QuestionFrame } from './QuestionFrame';
import { Select } from './primitives';

interface DropdownFieldProps {
  question: DropdownQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue | undefined) => void;
  errorText?: string;
}

/** Pick one option from a list. */
export function DropdownField({ question, value, onChange, errorText }: DropdownFieldProps) {
  const { t } = useTranslation();

  return (
    <QuestionFrame question={question} errorText={errorText}>
      <Select
        label={question.title}
        hideLabel
        placeholder={t('fill.choose')}
        value={readChoice(value).optionId}
        options={orderedOptions(question).map((option) => ({ value: option.id, label: option.label }))}
        onChange={(optionId) => onChange({ optionId })}
        closeLabel={t('common.cancel')}
        testID={testIdFor.questionInput(question.id)}
      />
    </QuestionFrame>
  );
}
