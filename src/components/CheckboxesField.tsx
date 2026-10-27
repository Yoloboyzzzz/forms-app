import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { AnswerValue, CheckboxesQuestion } from '@/types/models';
import { readCheckboxes } from '@/utils/answers';
import { orderedOptions } from '@/utils/options';
import { QuestionFrame } from './QuestionFrame';
import { Checkbox, InputField, Stack } from './primitives';

interface CheckboxesFieldProps {
  question: CheckboxesQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue | undefined) => void;
  errorText?: string;
}

/** Tick any number of options, and optionally add an "Other" text. */
export function CheckboxesField({ question, value, onChange, errorText }: CheckboxesFieldProps) {
  const { t } = useTranslation();
  const { optionIds, other } = readCheckboxes(value);
  const otherChecked = other !== undefined;

  /** Nothing ticked and no other text means no answer at all. */
  function emit(nextIds: string[], nextOther: string | undefined): void {
    onChange(nextIds.length === 0 && nextOther === undefined ? undefined : { optionIds: nextIds, other: nextOther });
  }

  return (
    <QuestionFrame question={question} errorText={errorText}>
      <Stack>
        {orderedOptions(question).map((option) => (
          <Checkbox
            key={option.id}
            label={option.label}
            checked={optionIds.includes(option.id)}
            onChange={(checked) =>
              emit(checked ? [...optionIds, option.id] : optionIds.filter((id) => id !== option.id), other)
            }
            testID={testIdFor.questionOption(question.id, option.id)}
          />
        ))}
        {question.settings.hasOtherOption === true && (
          <Checkbox
            label={t('fill.other')}
            checked={otherChecked}
            onChange={(checked) => emit(optionIds, checked ? '' : undefined)}
            testID={testIdFor.questionOtherOption(question.id)}
          />
        )}
      </Stack>
      {otherChecked && (
        <InputField
          label={t('fill.other')}
          hideLabel
          placeholder={t('fill.otherPlaceholder')}
          value={other ?? ''}
          onChangeText={(text) => emit(optionIds, text)}
          testID={testIdFor.questionOther(question.id)}
        />
      )}
    </QuestionFrame>
  );
}
