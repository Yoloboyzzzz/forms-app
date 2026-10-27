import type { AnswerValue, ParagraphQuestion, ShortAnswerQuestion } from '@/types/models';
import { testIdFor } from '@/constants/testIds';
import { readText } from '@/utils/answers';
import { QuestionFrame } from './QuestionFrame';
import { InputField, TextArea } from './primitives';

interface TextFieldProps {
  question: ShortAnswerQuestion | ParagraphQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue | undefined) => void;
  errorText?: string;
}

/** Short answer: a single line of text. Paragraph questions use ParagraphField. */
export function ShortAnswerField({ question, value, onChange, errorText }: TextFieldProps) {
  return (
    <QuestionFrame question={question} errorText={errorText}>
      <InputField
        label={question.title}
        hideLabel
        value={readText(value)}
        onChangeText={(text) => onChange(text === '' ? undefined : text)}
        autoCapitalize="sentences"
        testID={testIdFor.questionInput(question.id)}
      />
    </QuestionFrame>
  );
}

/** Paragraph: several lines of text. */
export function ParagraphField({ question, value, onChange, errorText }: TextFieldProps) {
  return (
    <QuestionFrame question={question} errorText={errorText}>
      <TextArea
        label={question.title}
        hideLabel
        value={readText(value)}
        onChangeText={(text) => onChange(text === '' ? undefined : text)}
        autoCapitalize="sentences"
        testID={testIdFor.questionInput(question.id)}
      />
    </QuestionFrame>
  );
}
