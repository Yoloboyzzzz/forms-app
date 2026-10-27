import type { AnswerValue, Question } from '@/types/models';
import { assertNever } from '@/utils/assertNever';
import { CheckboxesField } from './CheckboxesField';
import { DateField } from './DateField';
import { DropdownField } from './DropdownField';
import { LinearScaleField } from './LinearScaleField';
import { MultipleChoiceField } from './MultipleChoiceField';
import { ParagraphField, ShortAnswerField } from './ShortAnswerField';
import { RatingField } from './RatingField';
import { TimeField } from './TimeField';

interface QuestionRendererProps {
  question: Question;
  value: AnswerValue | undefined;
  /** Called with the new answer, or undefined when the respondent cleared it. */
  onChange: (value: AnswerValue | undefined) => void;
  /** Translated error shown under the answer. */
  errorText?: string;
}

/** Shows the right input for a question's type. */
export function QuestionRenderer({ question, value, onChange, errorText }: QuestionRendererProps) {
  switch (question.questionType) {
    case 'short_answer':
      return <ShortAnswerField question={question} value={value} onChange={onChange} errorText={errorText} />;
    case 'paragraph':
      return <ParagraphField question={question} value={value} onChange={onChange} errorText={errorText} />;
    case 'multiple_choice':
      return <MultipleChoiceField question={question} value={value} onChange={onChange} errorText={errorText} />;
    case 'checkboxes':
      return <CheckboxesField question={question} value={value} onChange={onChange} errorText={errorText} />;
    case 'dropdown':
      return <DropdownField question={question} value={value} onChange={onChange} errorText={errorText} />;
    case 'linear_scale':
      return <LinearScaleField question={question} value={value} onChange={onChange} errorText={errorText} />;
    case 'date':
      return <DateField question={question} value={value} onChange={onChange} errorText={errorText} />;
    case 'rating':
      return <RatingField question={question} value={value} onChange={onChange} errorText={errorText} />;
    case 'time':
      return <TimeField question={question} value={value} onChange={onChange} errorText={errorText} />;
    // These types are not offered in the editor yet (plan phase 8), so there is nothing to show.
    case 'multiple_choice_grid':
    case 'checkbox_grid':
    case 'file_upload':
      return null;
    default:
      return assertNever(question);
  }
}
