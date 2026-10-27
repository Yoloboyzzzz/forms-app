import type { AnswerValue, Assignment, FormDetail, Submission } from '../types/models';
import { ServiceError, throwIfError, toServiceError } from './errors';
import { getFormDetail } from './formService';
import { parseAnswerValue, toAnswerPayload } from './mappers/answerMapper';
import { toAssignment, toSubmission } from './mappers/recordMappers';
import { supabase } from './supabase/client';

/** Everything the fill-in screen needs for one assignment. */
export interface FillData {
  assignment: Assignment;
  /** Published form with its active sections and questions (RLS hides the rest). */
  detail: FormDetail;
  /** The open draft, or the submitted response when there is no draft; absent until the user starts. */
  submission?: Submission;
  /** Saved answers by question id. */
  answers: Record<string, AnswerValue>;
}

/**
 * Loads an assignment of the signed-in user with the form, their response and its answers.
 * @throws ServiceError `notFound` when the assignment is not theirs or the form is not published.
 */
export async function getFillData(assignmentId: string): Promise<FillData> {
  const { data: assignmentRow, error } = await supabase
    .from('form_assignments')
    .select('*')
    .eq('id', assignmentId)
    .maybeSingle();
  throwIfError(error);
  if (assignmentRow === null) {
    throw new ServiceError('notFound');
  }
  const assignment = toAssignment(assignmentRow);
  const detail = await getFormDetail(assignment.formId);

  const { data: submissionRows, error: submissionError } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('assignment_id', assignmentId);
  throwIfError(submissionError);
  const submissions = (submissionRows ?? []).map(toSubmission);
  const submission = submissions.find((item) => item.status === 'draft') ?? submissions[0];
  if (submission === undefined) {
    return { assignment, detail, answers: {} };
  }

  const { data: answerRows, error: answerError } = await supabase
    .from('form_answers')
    .select('*')
    .eq('submission_id', submission.id);
  throwIfError(answerError);

  const answers: Record<string, AnswerValue> = {};
  for (const row of answerRows ?? []) {
    const question = detail.questions.find((item) => item.id === row.question_id);
    const value = question === undefined ? undefined : parseAnswerValue(question.questionType, row.value);
    if (value !== undefined) {
      answers[row.question_id] = value;
    }
  }
  return { assignment, detail, submission, answers };
}

/**
 * Returns the open draft of an assignment, or starts one.
 * @throws ServiceError `formClosed` (not accepting responses), `alreadySubmitted` (limit of one response).
 */
export async function getOrCreateDraft(assignmentId: string): Promise<Submission> {
  const { data: existing, error } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('status', 'draft')
    .maybeSingle();
  throwIfError(error);
  if (existing !== null) {
    return toSubmission(existing);
  }

  const { data, error: insertError } = await supabase
    .from('form_submissions')
    .insert({ assignment_id: assignmentId })
    .select('*')
    .single();
  if (insertError !== null) {
    const serviceError = toServiceError(insertError);
    // RLS refuses a draft when the form is unpublished, closed or not accepting responses.
    if (serviceError.code === 'forbidden') throw new ServiceError('formClosed', insertError);
    if (serviceError.code === 'duplicate') throw new ServiceError('alreadySubmitted', insertError);
    throw serviceError;
  }
  if (data === null) throw new ServiceError('unknown');
  return toSubmission(data);
}

/** Saves (or replaces) the answer to one question of a draft. */
export async function saveAnswer(submissionId: string, questionId: string, value: AnswerValue): Promise<void> {
  const { error } = await supabase
    .from('form_answers')
    .upsert(toAnswerPayload(submissionId, questionId, value), { onConflict: 'submission_id,question_id' });
  throwIfError(error);
}

/** Removes the answer to one question of a draft (the respondent cleared it). */
export async function deleteAnswer(submissionId: string, questionId: string): Promise<void> {
  const { error } = await supabase
    .from('form_answers')
    .delete()
    .eq('submission_id', submissionId)
    .eq('question_id', questionId);
  throwIfError(error);
}

/**
 * Submits a draft. The database checks that every required question on the visited path is answered.
 * @throws ServiceError `missingRequired`, `formClosed`.
 */
export async function submitSubmission(submissionId: string): Promise<Submission> {
  const { data, error } = await supabase
    .from('form_submissions')
    .update({ status: 'submitted' })
    .eq('id', submissionId)
    .select('*')
    .single();
  throwIfError(error);
  if (data === null) throw new ServiceError('unknown');
  return toSubmission(data);
}

/**
 * Turns a submitted response back into a draft so it can be edited. Only works when the form allows it.
 * @throws ServiceError `forbidden`.
 */
export async function reopenSubmission(submissionId: string): Promise<Submission> {
  const { data, error } = await supabase
    .from('form_submissions')
    .update({ status: 'draft' })
    .eq('id', submissionId)
    .select('*')
    .single();
  if (error !== null) {
    const serviceError = toServiceError(error);
    // RLS hides the row from the update when the form does not allow editing after submitting.
    throw serviceError.code === 'notFound' ? new ServiceError('forbidden', error) : serviceError;
  }
  if (data === null) throw new ServiceError('unknown');
  return toSubmission(data);
}
