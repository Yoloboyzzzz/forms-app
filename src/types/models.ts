import type {
  FormStatus,
  QuestionType,
  RatingIcon,
  SectionAfterAction,
  SubmissionStatus,
  UserRole,
} from './enums';

/** `goTo` value that ends the form; any other value is a section id. */
export const GO_TO_SUBMIT = 'submit';

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  status: FormStatus;
  isAcceptingResponses: boolean;
  closesAt?: Date;
  limitOneResponse: boolean;
  allowEditAfterSubmit: boolean;
  shuffleQuestionOrder: boolean;
  showProgressBar: boolean;
  confirmationMessage?: string;
  createdBy: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormSection {
  id: string;
  formId: string;
  title?: string;
  description?: string;
  orderIndex: number;
  afterAction: SectionAfterAction;
  goToSectionId?: string;
}

// ---------------------------------------------------------------- validation

export type NumberOperator =
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'eq'
  | 'neq'
  | 'between'
  | 'notBetween'
  | 'isNumber'
  | 'isWholeNumber';
export type TextOperator = 'contains' | 'notContains' | 'isEmail' | 'isUrl';
export type LengthOperator = 'max' | 'min';
export type RegexOperator = 'matches' | 'notMatches' | 'contains' | 'notContains';
export type CheckboxCountOperator = 'atLeast' | 'atMost' | 'exactly';

interface ValidationBase {
  errorMessage?: string;
}

export interface NumberValidation extends ValidationBase {
  kind: 'number';
  operator: NumberOperator;
  value?: number;
  /** Upper bound for `between` / `notBetween`. */
  valueMax?: number;
}

export interface TextValidation extends ValidationBase {
  kind: 'text';
  operator: TextOperator;
  value?: string;
}

export interface LengthValidation extends ValidationBase {
  kind: 'length';
  operator: LengthOperator;
  value: number;
}

export interface RegexValidation extends ValidationBase {
  kind: 'regex';
  operator: RegexOperator;
  value: string;
}

export interface CheckboxCountValidation extends ValidationBase {
  kind: 'checkboxCount';
  operator: CheckboxCountOperator;
  value: number;
}

export type ValidationRule =
  | NumberValidation
  | TextValidation
  | LengthValidation
  | RegexValidation
  | CheckboxCountValidation;

// ------------------------------------------------------------------- options

export interface ChoiceOption {
  id: string;
  label: string;
  /** Section id, or GO_TO_SUBMIT. Absent: continue with the next section. */
  goTo?: string;
}

export interface GridLine {
  id: string;
  label: string;
}

export interface GridOptions {
  rows: GridLine[];
  columns: GridLine[];
}

// ------------------------------------------------------------------ settings

export interface TextSettings {
  validation?: ValidationRule;
}

export interface SingleChoiceSettings {
  hasOtherOption?: boolean;
  shuffleOptions?: boolean;
  goToSectionBasedOnAnswer?: boolean;
}

export interface DropdownSettings {
  shuffleOptions?: boolean;
  goToSectionBasedOnAnswer?: boolean;
}

export interface CheckboxesSettings {
  hasOtherOption?: boolean;
  shuffleOptions?: boolean;
  validation?: ValidationRule;
}

export interface LinearScaleSettings {
  min?: 0 | 1;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface RatingSettings {
  max?: number;
  icon?: RatingIcon;
}

export interface GridSettings {
  requireEachRow?: boolean;
  limitOnePerColumn?: boolean;
  shuffleRows?: boolean;
}

export interface DateSettings {
  includeYear?: boolean;
  includeTime?: boolean;
}

export interface TimeSettings {
  isDuration?: boolean;
}

export interface FileUploadSettings {
  allowedTypes?: string[];
  maxFiles?: 1 | 5 | 10;
  maxFileSizeMb?: number;
}

// ----------------------------------------------------------------- questions

interface QuestionBase {
  id: string;
  formId: string;
  sectionId: string;
  title: string;
  description?: string;
  isRequired: boolean;
  imagePath?: string;
  orderIndex: number;
  isActive: boolean;
}

export interface ShortAnswerQuestion extends QuestionBase {
  questionType: 'short_answer';
  settings: TextSettings;
}

export interface ParagraphQuestion extends QuestionBase {
  questionType: 'paragraph';
  settings: TextSettings;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  questionType: 'multiple_choice';
  options: ChoiceOption[];
  settings: SingleChoiceSettings;
}

export interface CheckboxesQuestion extends QuestionBase {
  questionType: 'checkboxes';
  options: ChoiceOption[];
  settings: CheckboxesSettings;
}

export interface DropdownQuestion extends QuestionBase {
  questionType: 'dropdown';
  options: ChoiceOption[];
  settings: DropdownSettings;
}

export interface LinearScaleQuestion extends QuestionBase {
  questionType: 'linear_scale';
  settings: LinearScaleSettings;
}

export interface RatingQuestion extends QuestionBase {
  questionType: 'rating';
  settings: RatingSettings;
}

export interface MultipleChoiceGridQuestion extends QuestionBase {
  questionType: 'multiple_choice_grid';
  options: GridOptions;
  settings: GridSettings;
}

export interface CheckboxGridQuestion extends QuestionBase {
  questionType: 'checkbox_grid';
  options: GridOptions;
  settings: GridSettings;
}

export interface DateQuestion extends QuestionBase {
  questionType: 'date';
  settings: DateSettings;
}

export interface TimeQuestion extends QuestionBase {
  questionType: 'time';
  settings: TimeSettings;
}

export interface FileUploadQuestion extends QuestionBase {
  questionType: 'file_upload';
  settings: FileUploadSettings;
}

export type Question =
  | ShortAnswerQuestion
  | ParagraphQuestion
  | MultipleChoiceQuestion
  | CheckboxesQuestion
  | DropdownQuestion
  | LinearScaleQuestion
  | RatingQuestion
  | MultipleChoiceGridQuestion
  | CheckboxGridQuestion
  | DateQuestion
  | TimeQuestion
  | FileUploadQuestion;

export type QuestionOfType<T extends QuestionType> = Extract<Question, { questionType: T }>;

// ------------------------------------------------------------------- answers

export interface AnswerValueByType {
  short_answer: string;
  paragraph: string;
  multiple_choice: { optionId: string } | { other: string };
  checkboxes: { optionIds: string[]; other?: string };
  dropdown: { optionId: string };
  linear_scale: number;
  rating: number;
  multiple_choice_grid: Record<string, string>;
  checkbox_grid: Record<string, string[]>;
  date: string;
  time: string;
  file_upload: string[];
}

export type AnswerValue<T extends QuestionType = QuestionType> = AnswerValueByType[T];

export interface Answer {
  id: string;
  submissionId: string;
  questionId: string;
  value: AnswerValue;
  updatedAt: Date;
}

// ------------------------------------------------------ assignments, submissions

export interface Assignment {
  id: string;
  formId: string;
  userId: string;
  assignedBy: string;
  dueAt?: Date;
  assignedAt: Date;
}

export interface Submission {
  id: string;
  assignmentId: string;
  status: SubmissionStatus;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
