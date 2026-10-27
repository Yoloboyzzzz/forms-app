import type {
  AssignmentInsert,
  AssignmentRow,
  FormInsert,
  FormRow,
  FormUpdate,
  ProfileRow,
  SectionInsert,
  SectionRow,
  SectionUpdate,
  SubmissionRow,
} from '@/types/database';
import type {
  Assignment,
  Form,
  FormSection,
  FormSettings,
  Profile,
  Submission,
} from '@/types/models';
import { fromNullable, toDate, toOptionalDate } from './json';

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    mustChangePassword: row.must_change_password,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

export function toForm(row: FormRow): Form {
  return {
    id: row.id,
    title: row.title,
    description: fromNullable(row.description),
    status: row.status,
    isAcceptingResponses: row.is_accepting_responses,
    closesAt: toOptionalDate(row.closes_at),
    limitOneResponse: row.limit_one_response,
    allowEditAfterSubmit: row.allow_edit_after_submit,
    shuffleQuestionOrder: row.shuffle_question_order,
    showProgressBar: row.show_progress_bar,
    confirmationMessage: fromNullable(row.confirmation_message),
    createdBy: row.created_by,
    publishedAt: toOptionalDate(row.published_at),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

export function toFormInsert(draft: { title: string; description?: string }, createdBy: string): FormInsert {
  return { title: draft.title, description: draft.description ?? null, created_by: createdBy };
}

export type FormPatch = Partial<Pick<Form, 'title' | 'description'> & FormSettings>;

/**
 * Builds an update payload from the keys present in the patch.
 * A key that is present with value `undefined` clears the column (sets it to null).
 */
export function toFormUpdate(patch: FormPatch): FormUpdate {
  const update: FormUpdate = {};
  if ('title' in patch && patch.title !== undefined) update.title = patch.title;
  if ('description' in patch) update.description = patch.description ?? null;
  if ('isAcceptingResponses' in patch && patch.isAcceptingResponses !== undefined) {
    update.is_accepting_responses = patch.isAcceptingResponses;
  }
  if ('closesAt' in patch) update.closes_at = patch.closesAt === undefined ? null : patch.closesAt.toISOString();
  if ('limitOneResponse' in patch && patch.limitOneResponse !== undefined) {
    update.limit_one_response = patch.limitOneResponse;
  }
  if ('allowEditAfterSubmit' in patch && patch.allowEditAfterSubmit !== undefined) {
    update.allow_edit_after_submit = patch.allowEditAfterSubmit;
  }
  if ('shuffleQuestionOrder' in patch && patch.shuffleQuestionOrder !== undefined) {
    update.shuffle_question_order = patch.shuffleQuestionOrder;
  }
  if ('showProgressBar' in patch && patch.showProgressBar !== undefined) {
    update.show_progress_bar = patch.showProgressBar;
  }
  if ('confirmationMessage' in patch) update.confirmation_message = patch.confirmationMessage ?? null;
  return update;
}

export function toSection(row: SectionRow): FormSection {
  return {
    id: row.id,
    formId: row.form_id,
    title: fromNullable(row.title),
    description: fromNullable(row.description),
    orderIndex: row.order_index,
    afterAction: row.after_action,
    goToSectionId: fromNullable(row.go_to_section_id),
  };
}

export type SectionDraft = Omit<FormSection, 'id'>;

export function toSectionInsert(draft: SectionDraft): SectionInsert {
  return {
    form_id: draft.formId,
    title: draft.title ?? null,
    description: draft.description ?? null,
    order_index: draft.orderIndex,
    after_action: draft.afterAction,
    go_to_section_id: draft.goToSectionId ?? null,
  };
}

export type SectionPatch = Partial<Omit<FormSection, 'id' | 'formId'>>;

/** Same clearing rule as toFormUpdate: a present key set to `undefined` clears the column. */
export function toSectionUpdate(patch: SectionPatch): SectionUpdate {
  const update: SectionUpdate = {};
  if ('title' in patch) update.title = patch.title ?? null;
  if ('description' in patch) update.description = patch.description ?? null;
  if ('orderIndex' in patch && patch.orderIndex !== undefined) update.order_index = patch.orderIndex;
  if ('afterAction' in patch && patch.afterAction !== undefined) update.after_action = patch.afterAction;
  if ('goToSectionId' in patch) update.go_to_section_id = patch.goToSectionId ?? null;
  return update;
}

export function toAssignment(row: AssignmentRow): Assignment {
  return {
    id: row.id,
    formId: row.form_id,
    userId: row.user_id,
    assignedBy: row.assigned_by,
    dueAt: toOptionalDate(row.due_at),
    assignedAt: toDate(row.assigned_at),
  };
}

export function toAssignmentInsert(
  formId: string,
  userId: string,
  assignedBy: string,
  dueAt?: Date,
): AssignmentInsert {
  return {
    form_id: formId,
    user_id: userId,
    assigned_by: assignedBy,
    due_at: dueAt === undefined ? null : dueAt.toISOString(),
  };
}

export function toSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    status: row.status,
    submittedAt: toOptionalDate(row.submitted_at),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}
