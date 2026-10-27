import type { Database } from './supabase';

type Tables = Database['public']['Tables'];

export type ProfileRow = Tables['profiles']['Row'];
export type FormRow = Tables['forms']['Row'];
export type FormInsert = Tables['forms']['Insert'];
export type FormUpdate = Tables['forms']['Update'];
export type SectionRow = Tables['form_sections']['Row'];
export type SectionInsert = Tables['form_sections']['Insert'];
export type SectionUpdate = Tables['form_sections']['Update'];
export type QuestionRow = Tables['form_questions']['Row'];
export type QuestionInsert = Tables['form_questions']['Insert'];
export type QuestionUpdate = Tables['form_questions']['Update'];
export type AssignmentRow = Tables['form_assignments']['Row'];
export type AssignmentInsert = Tables['form_assignments']['Insert'];
export type SubmissionRow = Tables['form_submissions']['Row'];
export type AnswerRow = Tables['form_answers']['Row'];
export type AnswerInsert = Tables['form_answers']['Insert'];
