import type { AnswerValue, Question, ResponseAnswer } from '@/types/models';
import { assertNever } from './assertNever';
import { readCheckboxes, readChoice, readNumber, readText } from './answers';

export interface OptionCount {
  id: string;
  label: string;
  count: number;
}

export type QuestionSummary =
  | {
      kind: 'choice';
      question: Question;
      /** Responses that answered this question. */
      total: number;
      counts: OptionCount[];
      /** What people typed for "Other". */
      otherAnswers: string[];
    }
  | {
      kind: 'scale';
      question: Question;
      total: number;
      average?: number;
      counts: { value: number; count: number }[];
    }
  | { kind: 'text'; question: Question; total: number; answers: string[] }
  /** Question types without a summary yet (plan phase 8). */
  | { kind: 'none'; question: Question };

function answersOf(question: Question, answers: readonly ResponseAnswer[]): AnswerValue[] {
  return answers.filter((answer) => answer.questionId === question.id).map((answer) => answer.value);
}

/** One summary per question, in the order given: counts for choices, distribution and average for scales, answers for text. */
export function summarizeResponses(questions: readonly Question[], answers: readonly ResponseAnswer[]): QuestionSummary[] {
  return questions.map((question): QuestionSummary => {
    const values = answersOf(question, answers);

    switch (question.questionType) {
      case 'multiple_choice':
      case 'dropdown':
      case 'checkboxes': {
        const counts: OptionCount[] = question.options.map((option) => ({ id: option.id, label: option.label, count: 0 }));
        const otherAnswers: string[] = [];
        for (const value of values) {
          const isBoxes = question.questionType === 'checkboxes';
          const boxes = readCheckboxes(value);
          const single = readChoice(value);
          const ids = isBoxes ? boxes.optionIds : single.optionId === undefined ? [] : [single.optionId];
          const other = isBoxes ? boxes.other : single.other;
          for (const entry of counts) {
            if (ids.includes(entry.id)) entry.count += 1;
          }
          if (other !== undefined && other.trim() !== '') otherAnswers.push(other.trim());
        }
        return { kind: 'choice', question, total: values.length, counts, otherAnswers };
      }
      case 'linear_scale':
      case 'rating': {
        const min = question.questionType === 'linear_scale' ? (question.settings.min ?? 1) : 1;
        const max = question.settings.max ?? 5;
        const numbers = values.flatMap((value) => {
          const n = readNumber(value);
          return n === undefined ? [] : [n];
        });
        const counts = Array.from({ length: max - min + 1 }, (_, index) => ({
          value: min + index,
          count: numbers.filter((n) => n === min + index).length,
        }));
        const average = numbers.length === 0 ? undefined : numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
        return { kind: 'scale', question, total: numbers.length, average, counts };
      }
      case 'short_answer':
      case 'paragraph':
      case 'date':
      case 'time': {
        const texts = values.map(readText).filter((text) => text.trim() !== '');
        return { kind: 'text', question, total: texts.length, answers: texts };
      }
      case 'multiple_choice_grid':
      case 'checkbox_grid':
      case 'file_upload':
        return { kind: 'none', question };
      default:
        return assertNever(question);
    }
  });
}

/** Share of `count` in `total` as a whole percentage (0 when there is nothing to divide by). */
export function percentage(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

/**
 * A readable version of an answer for the response detail view: option labels, the "other" text,
 * numbers and text as they are. Empty when unanswered.
 */
export function describeAnswer(question: Question, value: AnswerValue | undefined, otherLabel: string): string {
  if (value === undefined) return '';
  switch (question.questionType) {
    case 'multiple_choice':
    case 'dropdown': {
      const { optionId, other } = readChoice(value);
      const label = question.options.find((option) => option.id === optionId)?.label;
      if (label !== undefined) return label;
      return other === undefined || other.trim() === '' ? '' : `${otherLabel}: ${other.trim()}`;
    }
    case 'checkboxes': {
      const { optionIds, other } = readCheckboxes(value);
      const labels = question.options.filter((option) => optionIds.includes(option.id)).map((option) => option.label);
      if (other !== undefined && other.trim() !== '') labels.push(`${otherLabel}: ${other.trim()}`);
      return labels.join(', ');
    }
    case 'linear_scale':
    case 'rating':
      return readNumber(value)?.toString() ?? '';
    case 'short_answer':
    case 'paragraph':
    case 'date':
    case 'time':
      return readText(value);
    case 'file_upload':
      return Array.isArray(value) ? value.join(', ') : '';
    case 'multiple_choice_grid':
    case 'checkbox_grid':
      return typeof value === 'object' && !Array.isArray(value) ? JSON.stringify(value) : '';
    default:
      return assertNever(question);
  }
}
