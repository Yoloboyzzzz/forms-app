import type { QuestionType } from '@/types/enums';
import type { FormDetail, FormSection, Question, QuestionDraft } from '@/types/models';
import { assertNever } from './assertNever';

/** A stored question without its id, for saving it again. */
export function toQuestionDraft(question: Question): QuestionDraft {
  const { id: _id, ...draft } = question;
  return draft;
}

interface DefaultQuestionOptions {
  questionType: QuestionType;
  formId: string;
  sectionId: string;
  orderIndex: number;
  /** Translated placeholder title; titles may not be empty in the database. */
  title: string;
  /** Creates a stable id for options, rows and columns. */
  newId: () => string;
  /** Translated default label for the n-th (1-based) option, row or column. */
  optionLabel: (position: number) => string;
}

/** A new question of the given type with sensible defaults (two options, scale 1 to 5, ...). */
export function createDefaultQuestion(options: DefaultQuestionOptions): QuestionDraft {
  const { questionType, formId, sectionId, orderIndex, title, newId, optionLabel } = options;
  const base = { formId, sectionId, title, isRequired: false, orderIndex, isActive: true };
  const choices = [1, 2].map((position) => ({ id: newId(), label: optionLabel(position) }));

  switch (questionType) {
    case 'short_answer':
    case 'paragraph':
      return { ...base, questionType, settings: {} };
    case 'multiple_choice':
    case 'checkboxes':
    case 'dropdown':
      return { ...base, questionType, options: choices, settings: {} };
    case 'linear_scale':
      return { ...base, questionType, settings: { min: 1, max: 5 } };
    case 'rating':
      return { ...base, questionType, settings: { max: 5, icon: 'star' } };
    case 'multiple_choice_grid':
    case 'checkbox_grid':
      return {
        ...base,
        questionType,
        options: { rows: [{ id: newId(), label: optionLabel(1) }], columns: choices },
        settings: {},
      };
    case 'date':
      return { ...base, questionType, settings: { includeYear: true } };
    case 'time':
      return { ...base, questionType, settings: {} };
    case 'file_upload':
      return { ...base, questionType, settings: { maxFiles: 1, maxFileSizeMb: 10 } };
    default:
      return assertNever(questionType);
  }
}

/** Sections sorted by position. */
export function sortedSections(detail: FormDetail): FormSection[] {
  return [...detail.sections].sort((a, b) => a.orderIndex - b.orderIndex);
}

/** The questions of one section sorted by position (deactivated ones included for the editor). */
export function questionsOfSection(detail: FormDetail, sectionId: string): Question[] {
  return detail.questions
    .filter((question) => question.sectionId === sectionId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}
