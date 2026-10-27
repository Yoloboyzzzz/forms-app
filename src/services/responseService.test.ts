import { ServiceError } from './errors';
import { getFormResponses, getResponseDetail } from './responseService';
import { fakeQuery, type FakeQuery } from './testUtils/fakeQuery';

const mockFrom = jest.fn();

// Resolved lazily: the factory runs when the service is imported, before the const above is initialised.
jest.mock('@/services/supabase/client', () => ({ supabase: { from: (table: string) => mockFrom(table) } }));

const TS = '2026-10-27T10:00:00Z';
const formRow = {
  id: 'f1',
  title: 'Form',
  description: null,
  status: 'published',
  is_accepting_responses: true,
  closes_at: null,
  limit_one_response: true,
  allow_edit_after_submit: false,
  shuffle_question_order: false,
  show_progress_bar: true,
  confirmation_message: null,
  created_by: 'admin',
  published_at: TS,
  created_at: TS,
  updated_at: TS,
};
const sectionRow = {
  id: 's1',
  form_id: 'f1',
  title: null,
  description: null,
  order_index: 0,
  after_action: 'next',
  go_to_section_id: null,
  created_at: TS,
  updated_at: TS,
};
const questionRow = (id: string, type = 'short_answer') => ({
  id,
  form_id: 'f1',
  section_id: 's1',
  title: id,
  description: null,
  question_type: type,
  is_required: false,
  options: null,
  settings: {},
  image_path: null,
  order_index: 0,
  is_active: true,
  created_at: TS,
  updated_at: TS,
});
const assignmentRow = (id: string, userId: string) => ({
  id,
  form_id: 'f1',
  user_id: userId,
  assigned_by: 'admin',
  due_at: null,
  assigned_at: TS,
});
const profileRow = (id: string, name: string) => ({
  id,
  email: `${id}@b.c`,
  full_name: name,
  role: 'user',
  must_change_password: false,
  created_at: TS,
  updated_at: TS,
});
const submissionRow = (id: string, assignmentId: string, status: 'draft' | 'submitted') => ({
  id,
  assignment_id: assignmentId,
  status,
  submitted_at: status === 'submitted' ? TS : null,
  created_at: TS,
  updated_at: TS,
});
const answerRow = (submissionId: string, questionId: string, value: unknown) => ({
  id: `${submissionId}-${questionId}`,
  submission_id: submissionId,
  question_id: questionId,
  value,
  created_at: TS,
  updated_at: TS,
});

const ok = (data: unknown): FakeQuery => fakeQuery({ data, error: null });
const failure = (): FakeQuery => fakeQuery({ data: null, error: { code: '42501', message: 'x' } });
const queue = (...queries: FakeQuery[]) => queries.forEach((query) => mockFrom.mockReturnValueOnce(query.builder));

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof ServiceError ? error.code : 'not-a-service-error';
  }
}

/** getFormResponses asks, in this order: form, sections, questions, assignments, profiles. */
function queueFormAndAssignees(assignments: object[], profiles: object[]): void {
  queue(ok(formRow), ok([sectionRow]), ok([questionRow('q1'), questionRow('q2', 'linear_scale')]), ok(assignments));
  if (assignments.length > 0) queue(ok(profiles));
}

beforeEach(() => jest.resetAllMocks());

describe('getFormResponses', () => {
  it('lists each assignee with their submitted response and returns the submitted answers', async () => {
    queueFormAndAssignees([assignmentRow('a1', 'u1'), assignmentRow('a2', 'u2'), assignmentRow('a3', 'u3')], [
      profileRow('u1', 'Ann'),
      profileRow('u2', 'Bob'),
      profileRow('u3', 'Cleo'),
    ]);
    queue(
      ok([submissionRow('s1', 'a1', 'submitted'), submissionRow('s2', 'a2', 'draft')]),
      ok([answerRow('s1', 'q1', 'hello'), answerRow('s1', 'q2', 4)]),
    );

    const responses = await getFormResponses('f1');

    expect(responses.rows.map((row) => [row.user.fullName, row.submission?.status])).toEqual([
      ['Ann', 'submitted'],
      ['Bob', 'draft'],
      ['Cleo', undefined],
    ]);
    expect(responses.answers).toEqual([
      { submissionId: 's1', questionId: 'q1', value: 'hello' },
      { submissionId: 's1', questionId: 'q2', value: 4 },
    ]);
  });

  it('prefers a submitted response over a draft of the same person', async () => {
    queueFormAndAssignees([assignmentRow('a1', 'u1')], [profileRow('u1', 'Ann')]);
    queue(ok([submissionRow('d', 'a1', 'draft'), submissionRow('s', 'a1', 'submitted')]), ok([]));
    const responses = await getFormResponses('f1');
    expect(responses.rows[0].submission?.id).toBe('s');
  });

  it('returns no rows and no answers for a form nobody has', async () => {
    queueFormAndAssignees([], []);
    const responses = await getFormResponses('f1');
    expect(responses.rows).toEqual([]);
    expect(responses.answers).toEqual([]);
    expect(responses.detail.form.id).toBe('f1');
  });

  it('does not ask for answers when nothing was submitted', async () => {
    queueFormAndAssignees([assignmentRow('a1', 'u1')], [profileRow('u1', 'Ann')]);
    queue(ok([submissionRow('d', 'a1', 'draft')]));
    const responses = await getFormResponses('f1');
    expect(responses.answers).toEqual([]);
    expect(mockFrom).toHaveBeenCalledTimes(6);
  });

  it('skips answers that do not fit their question or whose question is gone', async () => {
    queueFormAndAssignees([assignmentRow('a1', 'u1')], [profileRow('u1', 'Ann')]);
    queue(ok([submissionRow('s1', 'a1', 'submitted')]), ok([answerRow('s1', 'q2', 'text'), answerRow('s1', 'gone', 'x'), answerRow('s1', 'q1', 'ok')]));
    expect((await getFormResponses('f1')).answers).toEqual([{ submissionId: 's1', questionId: 'q1', value: 'ok' }]);
  });

  it('handles missing lists', async () => {
    queueFormAndAssignees([assignmentRow('a1', 'u1')], [profileRow('u1', 'Ann')]);
    queue(ok(null));
    expect((await getFormResponses('f1')).rows[0].submission).toBeUndefined();
    queueFormAndAssignees([assignmentRow('a1', 'u1')], [profileRow('u1', 'Ann')]);
    queue(ok([submissionRow('s1', 'a1', 'submitted')]), ok(null));
    expect((await getFormResponses('f1')).answers).toEqual([]);
  });

  it('maps database errors', async () => {
    queueFormAndAssignees([assignmentRow('a1', 'u1')], [profileRow('u1', 'Ann')]);
    queue(failure());
    expect(await codeOf(getFormResponses('f1'))).toBe('forbidden');
    queueFormAndAssignees([assignmentRow('a1', 'u1')], [profileRow('u1', 'Ann')]);
    queue(ok([submissionRow('s1', 'a1', 'submitted')]), failure());
    expect(await codeOf(getFormResponses('f1'))).toBe('forbidden');
  });
});

describe('getResponseDetail', () => {
  /** submission, assignment, profile, then the form (3 queries), then answers. */
  function queueDetail(answers: unknown): void {
    queue(
      ok(submissionRow('s1', 'a1', 'submitted')),
      ok(assignmentRow('a1', 'u1')),
      ok(profileRow('u1', 'Ann')),
      ok(formRow),
      ok([sectionRow]),
      ok([questionRow('q1'), questionRow('q2', 'linear_scale')]),
      ok(answers),
    );
  }

  it('returns the response with its person, form and answers', async () => {
    queueDetail([answerRow('s1', 'q1', 'hello'), answerRow('s1', 'q2', 5)]);

    const detail = await getResponseDetail('s1');

    expect(detail.row.user.fullName).toBe('Ann');
    expect(detail.row.submission?.id).toBe('s1');
    expect(detail.detail.questions).toHaveLength(2);
    expect(detail.answers).toEqual({ q1: 'hello', q2: 5 });
  });

  it('skips answers that do not fit and handles no answers', async () => {
    queueDetail([answerRow('s1', 'q2', 'text'), answerRow('s1', 'gone', 'x')]);
    expect((await getResponseDetail('s1')).answers).toEqual({});
    queueDetail(null);
    expect((await getResponseDetail('s1')).answers).toEqual({});
  });

  it.each([
    ['submission', [ok(null)]],
    ['assignment', [ok(submissionRow('s1', 'a1', 'submitted')), ok(null)]],
    ['profile', [ok(submissionRow('s1', 'a1', 'submitted')), ok(assignmentRow('a1', 'u1')), ok(null)]],
  ])('reports a missing %s', async (_name, queries) => {
    queue(...queries);
    expect(await codeOf(getResponseDetail('s1'))).toBe('notFound');
  });

  it.each([0, 1, 2, 3])('maps an error in query %i', async (index) => {
    const queries = [
      ok(submissionRow('s1', 'a1', 'submitted')),
      ok(assignmentRow('a1', 'u1')),
      ok(profileRow('u1', 'Ann')),
      ok(formRow),
    ];
    queries[index] = failure();
    // the form is loaded with three parallel queries; the other two still run
    queue(...queries, ...(index === 3 ? [ok([]), ok([])] : []));
    expect(await codeOf(getResponseDetail('s1'))).toBe('forbidden');
  });

  it('maps an error loading the answers', async () => {
    queue(
      ok(submissionRow('s1', 'a1', 'submitted')),
      ok(assignmentRow('a1', 'u1')),
      ok(profileRow('u1', 'Ann')),
      ok(formRow),
      ok([sectionRow]),
      ok([questionRow('q1')]),
      failure(),
    );
    expect(await codeOf(getResponseDetail('s1'))).toBe('forbidden');
  });
});
