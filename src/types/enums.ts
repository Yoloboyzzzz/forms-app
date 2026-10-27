import type { Database } from './supabase';

type DbEnums = Database['public']['Enums'];

/** Value lists live here so UI (pickers) and parsers can iterate them; the `satisfies` checks keep them in sync with the database. */
export const USER_ROLES = ['admin', 'user'] as const satisfies readonly DbEnums['user_role'][];
export type UserRole = (typeof USER_ROLES)[number];

export const FORM_STATUSES = ['draft', 'published', 'archived'] as const satisfies readonly DbEnums['form_status'][];
export type FormStatus = (typeof FORM_STATUSES)[number];

export const SUBMISSION_STATUSES = ['draft', 'submitted'] as const satisfies readonly DbEnums['submission_status'][];
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SECTION_AFTER_ACTIONS = ['next', 'goto', 'submit'] as const satisfies readonly DbEnums['section_after_action'][];
export type SectionAfterAction = (typeof SECTION_AFTER_ACTIONS)[number];

export const QUESTION_TYPES = [
  'short_answer',
  'paragraph',
  'multiple_choice',
  'checkboxes',
  'dropdown',
  'linear_scale',
  'rating',
  'multiple_choice_grid',
  'checkbox_grid',
  'date',
  'time',
  'file_upload',
] as const satisfies readonly DbEnums['question_type'][];
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** Question types supported in the PWA release (plan Phase 4); the rest follow in Phase 8. */
export const CORE_QUESTION_TYPES = [
  'short_answer',
  'paragraph',
  'multiple_choice',
  'checkboxes',
  'dropdown',
  'linear_scale',
  'date',
] as const satisfies readonly QuestionType[];

/** Question types the editor and fill-in screens support so far (grows with plan phase 8). */
export const EDITOR_QUESTION_TYPES = [...CORE_QUESTION_TYPES, 'rating', 'time', 'multiple_choice_grid', 'checkbox_grid'] as const satisfies readonly QuestionType[];

export const RATING_ICONS = ['star', 'heart', 'thumb'] as const;
export type RatingIcon = (typeof RATING_ICONS)[number];
