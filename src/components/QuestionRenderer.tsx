import type { AnswerValue, FileUploadQuestion, Question } from '@/types/models';
import { testIdFor } from '@/constants/testIds';
import { assertNever } from '@/utils/assertNever';
import { CheckboxesField } from './CheckboxesField';
import { ChoiceGridField } from './ChoiceGridField';
import { DateField } from './DateField';
import { DropdownField } from './DropdownField';
import { FileUploadField } from './FileUploadField';
import { LinearScaleField } from './LinearScaleField';
import { MultipleChoiceField } from './MultipleChoiceField';
import { ParagraphField, ShortAnswerField } from './ShortAnswerField';
import { QuestionImage } from './QuestionImage';
import { RatingField } from './RatingField';
import { Stack } from './primitives';
import { TimeField } from './TimeField';

/** What the fill-in screen provides for file upload questions. */
export interface FileUploadControls {
  onPick: (question: FileUploadQuestion) => void;
  onRemove: (question: FileUploadQuestion, path: string) => void;
  /** The question whose files are being uploaded right now. */
  uploadingQuestionId?: string;
  /** Translated upload problems by question id. */
  errors: Record<string, string>;
}

interface QuestionRendererProps {
  question: Question;
  value: AnswerValue | undefined;
  /** Called with the new answer, or undefined when the respondent cleared it. */
  onChange: (value: AnswerValue | undefined) => void;
  /** Translated error shown under the answer. */
  errorText?: string;
  /** Needed for file upload questions; they show nothing without it. */
  fileUpload?: FileUploadControls;
  /** Temporary link of the question's image, when it has one. */
  imageUrl?: string;
}

/** Shows the right input for a question's type. */
export function QuestionRenderer({ question, value, onChange, errorText, fileUpload, imageUrl }: QuestionRendererProps) {
  const field = renderField({ question, value, onChange, errorText, fileUpload });
  if (imageUrl === undefined || field === null) {
    return field;
  }
  return (
    <Stack gap="sm">
      <QuestionImage uri={imageUrl} description={question.title} testID={testIdFor.questionImage(question.id)} />
      {field}
    </Stack>
  );
}

function renderField({ question, value, onChange, errorText, fileUpload }: QuestionRendererProps) {
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
    case 'multiple_choice_grid':
    case 'checkbox_grid':
      return <ChoiceGridField question={question} value={value} onChange={onChange} errorText={errorText} />;
    case 'file_upload':
      return fileUpload === undefined ? null : (
        <FileUploadField
          question={question}
          value={value}
          onPick={() => fileUpload.onPick(question)}
          onRemove={(path) => fileUpload.onRemove(question, path)}
          isUploading={fileUpload.uploadingQuestionId === question.id}
          uploadErrorText={fileUpload.errors[question.id]}
          errorText={errorText}
        />
      );
    default:
      return assertNever(question);
  }
}
