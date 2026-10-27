import type { AnswerInsert, AnswerRow } from '@/types/database';
import type { QuestionType } from '@/types/enums';
import type { Answer, AnswerValue } from '@/types/models';
import { assertNever } from '@/utils/assertNever';
import { isRecord, readString, readStringArray, toDate, toJson } from './json';

function parseStringRecord(raw: unknown): Record<string, string> | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  const entries = Object.entries(raw);
  if (!entries.every((entry): entry is [string, string] => typeof entry[1] === 'string')) {
    return undefined;
  }
  return Object.fromEntries(entries);
}

function parseStringArrayRecord(raw: unknown): Record<string, string[]> | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!Array.isArray(value) || !value.every((item): item is string => typeof item === 'string')) {
      return undefined;
    }
    result[key] = value;
  }
  return result;
}

/** Parses a stored answer value for a question type; undefined when the stored shape is invalid. */
export function parseAnswerValue(questionType: QuestionType, raw: unknown): AnswerValue | undefined {
  switch (questionType) {
    case 'short_answer':
    case 'paragraph':
    case 'date':
    case 'time':
      return typeof raw === 'string' ? raw : undefined;
    case 'linear_scale':
    case 'rating':
      return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
    case 'multiple_choice': {
      if (!isRecord(raw)) {
        return undefined;
      }
      const optionId = readString(raw, 'optionId');
      if (optionId !== undefined) {
        return { optionId };
      }
      const other = readString(raw, 'other');
      return other === undefined ? undefined : { other };
    }
    case 'dropdown': {
      const optionId = isRecord(raw) ? readString(raw, 'optionId') : undefined;
      return optionId === undefined ? undefined : { optionId };
    }
    case 'checkboxes': {
      if (!isRecord(raw)) {
        return undefined;
      }
      const optionIds = readStringArray(raw, 'optionIds');
      return optionIds === undefined ? undefined : { optionIds, other: readString(raw, 'other') };
    }
    case 'multiple_choice_grid':
      return parseStringRecord(raw);
    case 'checkbox_grid':
      return parseStringArrayRecord(raw);
    case 'file_upload': {
      return Array.isArray(raw) && raw.every((item): item is string => typeof item === 'string') ? raw : undefined;
    }
    default:
      return assertNever(questionType);
  }
}

/** Row → model. The question type decides how the jsonb value is read; undefined when it does not fit. */
export function toAnswer(row: AnswerRow, questionType: QuestionType): Answer | undefined {
  const value = parseAnswerValue(questionType, row.value);
  if (value === undefined) {
    return undefined;
  }
  return {
    id: row.id,
    submissionId: row.submission_id,
    questionId: row.question_id,
    value,
    updatedAt: toDate(row.updated_at),
  };
}

/** Used for upserts on (submission_id, question_id). */
export function toAnswerPayload(submissionId: string, questionId: string, value: AnswerValue): AnswerInsert {
  return { submission_id: submissionId, question_id: questionId, value: toJson(value) };
}
