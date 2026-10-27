import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { AnswerValue, MultipleChoiceQuestion } from '@/types/models';
import { isAnswered, readChoice } from '@/utils/answers';
import { orderedOptions } from '@/utils/options';
import { QuestionFrame } from './QuestionFrame';
import { Button, InputField, Radio, Stack } from './primitives';

interface MultipleChoiceFieldProps {
  question: MultipleChoiceQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue | undefined) => void;
  errorText?: string;
}

/** Pick one option, or "Other" with a text of your own when the question allows it. */
export function MultipleChoiceField({ question, value, onChange, errorText }: MultipleChoiceFieldProps) {
  const { t } = useTranslation();
  const choice = readChoice(value);
  const otherSelected = choice.other !== undefined;

  return (
    <QuestionFrame question={question} errorText={errorText}>
      <Stack>
        {orderedOptions(question).map((option) => (
          <Radio
            key={option.id}
            label={option.label}
            value={option.id}
            selected={choice.optionId === option.id}
            onSelect={() => onChange({ optionId: option.id })}
            testID={testIdFor.questionOption(question.id, option.id)}
          />
        ))}
        {question.settings.hasOtherOption === true && (
          <Radio
            label={t('fill.other')}
            value="other"
            selected={otherSelected}
            onSelect={() => onChange({ other: choice.other ?? '' })}
            testID={testIdFor.questionOtherOption(question.id)}
          />
        )}
      </Stack>
      {otherSelected && (
        <InputField
          label={t('fill.other')}
          hideLabel
          placeholder={t('fill.otherPlaceholder')}
          value={choice.other ?? ''}
          onChangeText={(text) => onChange({ other: text })}
          testID={testIdFor.questionOther(question.id)}
        />
      )}
      {!question.isRequired && isAnswered(value) && (
        <Button
          label={t('fill.clear')}
          variant="ghost"
          onPress={() => onChange(undefined)}
          testID={testIdFor.questionClear(question.id)}
        />
      )}
    </QuestionFrame>
  );
}
