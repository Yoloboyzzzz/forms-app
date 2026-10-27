import type { AnswerValue, Question } from '@/types/models';
import { assertNever } from './assertNever';
import type { AnswerMap } from './branching';
import { validateSelectionCount, validateText, type ValidationFailure } from './validation';

/** Why an answer is not accepted: it is missing, or it breaks the question's validation rule. */
export type AnswerError = { kind: 'required' } | { kind: 'rule'; failure: ValidationFailure };

function hasText(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== '';
}

/** Whether the respondent gave a real answer (not empty text, no option picked, nothing ticked). */
export function isAnswered(value: AnswerValue | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value === 'string') return hasText(value);
  if (typeof value === 'number') return true;
  if (Array.isArray(value)) return value.length > 0;
  if ('optionIds' in value && Array.isArray(value.optionIds)) {
    return value.optionIds.length > 0 || hasText(typeof value.other === 'string' ? value.other : undefined);
  }
  if ('optionId' in value) return typeof value.optionId === 'string' && value.optionId !== '';
  if ('other' in value) return typeof value.other === 'string' && hasText(value.other);
  return Object.keys(value).length > 0; // grid answers: one entry per answered row
}

/** The error for one question's answer, or undefined when it is fine. Hidden (inactive) questions never fail. */
export function getAnswerError(question: Question, value: AnswerValue | undefined): AnswerError | undefined {
  if (!question.isActive) return undefined;
  if (!isAnswered(value)) {
    return question.isRequired ? { kind: 'required' } : undefined;
  }

  switch (question.questionType) {
    case 'short_answer':
    case 'paragraph': {
      const rule = question.settings.validation;
      const failure = rule !== undefined && typeof value === 'string' ? validateText(rule, value) : undefined;
      return failure === undefined ? undefined : { kind: 'rule', failure };
    }
    case 'checkboxes': {
      const rule = question.settings.validation;
      if (rule === undefined || typeof value !== 'object' || Array.isArray(value) || !('optionIds' in value)) {
        return undefined;
      }
      if (!Array.isArray(value.optionIds)) return undefined;
      const count = value.optionIds.length + (hasText(typeof value.other === 'string' ? value.other : undefined) ? 1 : 0);
      const failure = validateSelectionCount(rule, count);
      return failure === undefined ? undefined : { kind: 'rule', failure };
    }
    case 'multiple_choice':
    case 'dropdown':
    case 'linear_scale':
    case 'rating':
    case 'multiple_choice_grid':
    case 'checkbox_grid':
    case 'date':
    case 'time':
    case 'file_upload':
      return undefined;
    default:
      return assertNever(question);
  }
}

/** Errors by question id for the questions of one section. Questions without an error are left out. */
export function getSectionErrors(
  questions: readonly Question[],
  sectionId: string,
  answers: AnswerMap,
): Record<string, AnswerError> {
  const errors: Record<string, AnswerError> = {};
  for (const question of questions) {
    if (question.sectionId !== sectionId) continue;
    const error = getAnswerError(question, answers[question.id]);
    if (error !== undefined) errors[question.id] = error;
  }
  return errors;
}
