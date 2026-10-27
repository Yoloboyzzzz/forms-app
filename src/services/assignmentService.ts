import type { FormAssignee, MyAssignment } from '../types/models';
import { throwIfError } from './errors';
import {
  toAssignment,
  toAssignmentInsert,
  toForm,
  toProfile,
  toSubmission,
} from './mappers/recordMappers';
import { supabase } from './supabase/client';

/**
 * Assigns a form to users. Users that already have it are skipped, so their due date and
 * response stay untouched.
 */
export async function assignUsers(formId: string, userIds: string[], assignedBy: string, dueAt?: Date): Promise<void> {
  if (userIds.length === 0) {
    return;
  }
  const rows = userIds.map((userId) => toAssignmentInsert(formId, userId, assignedBy, dueAt));
  const { error } = await supabase
    .from('form_assignments')
    .upsert(rows, { onConflict: 'form_id,user_id', ignoreDuplicates: true });
  throwIfError(error);
}

/** Changes or removes (undefined) the due date of one assignment. */
export async function updateDueDate(assignmentId: string, dueAt?: Date): Promise<void> {
  const { error } = await supabase
    .from('form_assignments')
    .update({ due_at: dueAt === undefined ? null : dueAt.toISOString() })
    .eq('id', assignmentId);
  throwIfError(error);
}

/**
 * Removes an assignment. This also deletes the user's response to it (the database cascades),
 * so callers must ask for confirmation first.
 */
export async function unassign(assignmentId: string): Promise<void> {
  const { error } = await supabase.from('form_assignments').delete().eq('id', assignmentId);
  throwIfError(error);
}

/** Everyone a form is assigned to, sorted by name. Admin only (RLS). */
export async function listFormAssignees(formId: string): Promise<FormAssignee[]> {
  const { data: assignmentRows, error } = await supabase
    .from('form_assignments')
    .select('*')
    .eq('form_id', formId)
    .order('assigned_at', { ascending: true });
  throwIfError(error);
  const assignments = (assignmentRows ?? []).map(toAssignment);
  if (assignments.length === 0) {
    return [];
  }

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', assignments.map((assignment) => assignment.userId));
  throwIfError(profileError);
  const users = new Map((profileRows ?? []).map((row) => [row.id, toProfile(row)]));

  return assignments
    .flatMap((assignment) => {
      const user = users.get(assignment.userId);
      return user === undefined ? [] : [{ assignment, user }];
    })
    .sort((a, b) => a.user.fullName.localeCompare(b.user.fullName));
}

/**
 * The signed-in user's assignments with form and response status, most recently assigned first.
 * Forms that are not published are hidden by RLS, so their assignments do not show up.
 */
export async function listMyAssignments(userId: string): Promise<MyAssignment[]> {
  const { data: assignmentRows, error } = await supabase
    .from('form_assignments')
    .select('*')
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false });
  throwIfError(error);
  const assignments = (assignmentRows ?? []).map(toAssignment);
  if (assignments.length === 0) {
    return [];
  }

  const [formsResult, submissionsResult] = await Promise.all([
    supabase.from('forms').select('*').in('id', assignments.map((assignment) => assignment.formId)),
    supabase.from('form_submissions').select('*').in('assignment_id', assignments.map((assignment) => assignment.id)),
  ]);
  throwIfError(formsResult.error);
  throwIfError(submissionsResult.error);

  const forms = new Map((formsResult.data ?? []).map((row) => [row.id, toForm(row)]));
  const submissions = new Map<string, ReturnType<typeof toSubmission>>();
  for (const row of submissionsResult.data ?? []) {
    const submission = toSubmission(row);
    const existing = submissions.get(submission.assignmentId);
    // A submitted response wins over a newer draft (a reopened one is a draft again).
    if (existing === undefined || existing.status !== 'submitted') {
      submissions.set(submission.assignmentId, submission);
    }
  }

  return assignments.flatMap((assignment) => {
    const form = forms.get(assignment.formId);
    return form === undefined ? [] : [{ assignment, form, submission: submissions.get(assignment.id) }];
  });
}
