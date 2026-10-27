import type { AnswerValue, FormResponses, ResponseAnswer, ResponseDetail, ResponseRow, Submission } from '../types/models';
import { ServiceError, throwIfError } from './errors';
import { listFormAssignees } from './assignmentService';
import { getFormDetail } from './formService';
import { parseAnswerValue } from './mappers/answerMapper';
import { toAssignment, toProfile, toSubmission } from './mappers/recordMappers';
import { supabase } from './supabase/client';

/** The submitted response if there is one, else the draft. */
function pickSubmission(submissions: Submission[]): Submission | undefined {
  return submissions.find((item) => item.status === 'submitted') ?? submissions[0];
}

/**
 * Who has the form and how far they got, plus the answers of all submitted responses (for the summary).
 * Admin only (RLS).
 */
export async function getFormResponses(formId: string): Promise<FormResponses> {
  const [detail, assignees] = await Promise.all([getFormDetail(formId), listFormAssignees(formId)]);
  if (assignees.length === 0) {
    return { detail, rows: [], answers: [] };
  }

  const { data: submissionRows, error } = await supabase
    .from('form_submissions')
    .select('*')
    .in('assignment_id', assignees.map((assignee) => assignee.assignment.id));
  throwIfError(error);
  const submissions = (submissionRows ?? []).map(toSubmission);

  const rows: ResponseRow[] = assignees.map((assignee) => ({
    ...assignee,
    submission: pickSubmission(submissions.filter((item) => item.assignmentId === assignee.assignment.id)),
  }));

  const submittedIds = submissions.filter((item) => item.status === 'submitted').map((item) => item.id);
  if (submittedIds.length === 0) {
    return { detail, rows, answers: [] };
  }
  const { data: answerRows, error: answerError } = await supabase
    .from('form_answers')
    .select('*')
    .in('submission_id', submittedIds);
  throwIfError(answerError);

  const answers: ResponseAnswer[] = [];
  for (const row of answerRows ?? []) {
    const question = detail.questions.find((item) => item.id === row.question_id);
    const value = question === undefined ? undefined : parseAnswerValue(question.questionType, row.value);
    if (value !== undefined) {
      answers.push({ submissionId: row.submission_id, questionId: row.question_id, value });
    }
  }
  return { detail, rows, answers };
}

/**
 * One response with all its answers and the form it belongs to.
 * @throws ServiceError `notFound`.
 */
export async function getResponseDetail(submissionId: string): Promise<ResponseDetail> {
  const { data: submissionRow, error } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();
  throwIfError(error);
  if (submissionRow === null) throw new ServiceError('notFound');
  const submission = toSubmission(submissionRow);

  const { data: assignmentRow, error: assignmentError } = await supabase
    .from('form_assignments')
    .select('*')
    .eq('id', submission.assignmentId)
    .maybeSingle();
  throwIfError(assignmentError);
  if (assignmentRow === null) throw new ServiceError('notFound');
  const assignment = toAssignment(assignmentRow);

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', assignment.userId)
    .maybeSingle();
  throwIfError(profileError);
  if (profileRow === null) throw new ServiceError('notFound');

  const detail = await getFormDetail(assignment.formId);
  const { data: answerRows, error: answerError } = await supabase
    .from('form_answers')
    .select('*')
    .eq('submission_id', submissionId);
  throwIfError(answerError);

  const answers: Record<string, AnswerValue> = {};
  for (const row of answerRows ?? []) {
    const question = detail.questions.find((item) => item.id === row.question_id);
    const value = question === undefined ? undefined : parseAnswerValue(question.questionType, row.value);
    if (value !== undefined) answers[row.question_id] = value;
  }
  return { detail, row: { assignment, user: toProfile(profileRow), submission }, answers };
}
