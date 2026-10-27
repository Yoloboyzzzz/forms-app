import type { QuestionInsert, QuestionRow } from '@/types/database';
import type { Json } from '@/types/supabase';
import type { Question, QuestionDraft } from '@/types/models';
import { assertNever } from '@/utils/assertNever';
import { fromNullable, isRecord, toJson } from './json';
import {
  parseCheckboxesSettings,
  parseChoiceOptions,
  parseDateSettings,
  parseDropdownSettings,
  parseFileUploadSettings,
  parseGridOptions,
  parseGridSettings,
  parseLinearScaleSettings,
  parseRatingSettings,
  parseSingleChoiceSettings,
  parseTextSettings,
  parseTimeSettings,
} from './settingsParsers';

/** Row → model. Malformed jsonb falls back to empty settings/options instead of throwing. */
export function toQuestion(row: QuestionRow): Question {
  const base = {
    id: row.id,
    formId: row.form_id,
    sectionId: row.section_id,
    title: row.title,
    description: fromNullable(row.description),
    isRequired: row.is_required,
    imagePath: fromNullable(row.image_path),
    orderIndex: row.order_index,
    isActive: row.is_active,
  };
  const settings = isRecord(row.settings) ? row.settings : {};

  switch (row.question_type) {
    case 'short_answer':
      return { ...base, questionType: 'short_answer', settings: parseTextSettings(settings) };
    case 'paragraph':
      return { ...base, questionType: 'paragraph', settings: parseTextSettings(settings) };
    case 'multiple_choice':
      return {
        ...base,
        questionType: 'multiple_choice',
        options: parseChoiceOptions(row.options),
        settings: parseSingleChoiceSettings(settings),
      };
    case 'checkboxes':
      return {
        ...base,
        questionType: 'checkboxes',
        options: parseChoiceOptions(row.options),
        settings: parseCheckboxesSettings(settings),
      };
    case 'dropdown':
      return {
        ...base,
        questionType: 'dropdown',
        options: parseChoiceOptions(row.options),
        settings: parseDropdownSettings(settings),
      };
    case 'linear_scale':
      return { ...base, questionType: 'linear_scale', settings: parseLinearScaleSettings(settings) };
    case 'rating':
      return { ...base, questionType: 'rating', settings: parseRatingSettings(settings) };
    case 'multiple_choice_grid':
      return {
        ...base,
        questionType: 'multiple_choice_grid',
        options: parseGridOptions(row.options),
        settings: parseGridSettings(settings),
      };
    case 'checkbox_grid':
      return {
        ...base,
        questionType: 'checkbox_grid',
        options: parseGridOptions(row.options),
        settings: parseGridSettings(settings),
      };
    case 'date':
      return { ...base, questionType: 'date', settings: parseDateSettings(settings) };
    case 'time':
      return { ...base, questionType: 'time', settings: parseTimeSettings(settings) };
    case 'file_upload':
      return { ...base, questionType: 'file_upload', settings: parseFileUploadSettings(settings) };
    default:
      return assertNever(row.question_type);
  }
}

function serializeOptions(draft: QuestionDraft): Json | null {
  switch (draft.questionType) {
    case 'multiple_choice':
    case 'checkboxes':
    case 'dropdown':
      return draft.options.map((option) => ({ id: option.id, label: option.label, goTo: option.goTo ?? null }));
    case 'multiple_choice_grid':
    case 'checkbox_grid':
      return toJson(draft.options);
    case 'short_answer':
    case 'paragraph':
    case 'linear_scale':
    case 'rating':
    case 'date':
    case 'time':
    case 'file_upload':
      return null;
    default:
      return assertNever(draft);
  }
}

/** Model → insert/update payload (the same columns serve both). */
export function toQuestionPayload(draft: QuestionDraft): QuestionInsert {
  return {
    form_id: draft.formId,
    section_id: draft.sectionId,
    title: draft.title,
    description: draft.description ?? null,
    question_type: draft.questionType,
    is_required: draft.isRequired,
    options: serializeOptions(draft),
    settings: toJson(draft.settings),
    image_path: draft.imagePath ?? null,
    order_index: draft.orderIndex,
    is_active: draft.isActive,
  };
}
