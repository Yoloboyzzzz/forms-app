import { ServiceError } from './errors';
import {
  deleteAnswer,
  getFillData,
  getOrCreateDraft,
  reopenSubmission,
  saveAnswer,
  submitSubmission,
} from './submissionService';
import { fakeQuery, type FakeQuery } from './testUtils/fakeQuery';

const mockFrom = jest.fn();

// Resolved lazily: the factory runs when the service is imported, before the const above is initialised.
jest.mock('@/services/supabase/client', () => ({ supabase: { from: (table: string) => mockFrom(table) } }));

const TS = '2026-10-27T10:00:00Z';
const assignmentRow = { id: 'a1', form_id: 'f1', user_id: 'me', assigned_by: 'admin', due_at: null, assigned_at: TS };
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
const questionRow = (id: string, type: string, extra: object = {}) => ({
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
  ...extra,
});
const submissionRow = (id: string, status: 'draft' | 'submitted') => ({
  id,
  assignment_id: 'a1',
  status,
  submitted_at: status === 'submitted' ? TS : null,
  created_at: TS,
  updated_at: TS,
});
const answerRow = (questionId: string, value: unknown) => ({
  id: `ans-${questionId}`,
  submission_id: 'sub1',
  question_id: questionId,
  value,
  created_at: TS,
  updated_at: TS,
});

const ok = (data: unknown): FakeQuery => fakeQuery({ data, error: null });
const failure = (code = '42501'): FakeQuery => fakeQuery({ data: null, error: { code, message: 'x' } });
const queue = (...queries: FakeQuery[]) => queries.forEach((query) => mockFrom.mockReturnValueOnce(query.builder));

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof ServiceError ? error.code : 'not-a-service-error';
  }
}

/** assignment, then the three form queries, then submissions (and answers when a submission exists). */
function queueFill(submissions: unknown[], answers?: unknown[]): void {
  queue(
    ok(assignmentRow),
    ok(formRow),
    ok([sectionRow]),
    ok([questionRow('q1', 'short_answer'), questionRow('q2', 'linear_scale')]),
    ok(submissions),
  );
  if (answers !== undefined) queue(ok(answers));
}

beforeEach(() => jest.resetAllMocks());

describe('getFillData', () => {
  it('returns the form without a response when the user has not started', async () => {
    queueFill([]);

    const data = await getFillData('a1');

    expect(data.assignment.id).toBe('a1');
    expect(data.detail.questions).toHaveLength(2);
    expect(data.submission).toBeUndefined();
    expect(data.answers).toEqual({});
  });

  it('returns the draft with its parsed answers', async () => {
    queueFill([submissionRow('sub1', 'draft')], [answerRow('q1', 'hello'), answerRow('q2', 4)]);

    const data = await getFillData('a1');

    expect(data.submission).toMatchObject({ id: 'sub1', status: 'draft' });
    expect(data.answers).toEqual({ q1: 'hello', q2: 4 });
  });

  it('prefers the draft over a submitted response', async () => {
    queueFill([submissionRow('done', 'submitted'), submissionRow('sub1', 'draft')], []);
    expect((await getFillData('a1')).submission?.id).toBe('sub1');
  });

  it('shows the submitted response when there is no draft', async () => {
    queueFill([submissionRow('done', 'submitted')], []);
    expect((await getFillData('a1')).submission).toMatchObject({ id: 'done', status: 'submitted' });
  });

  it('skips answers that do not fit their question or whose question is hidden', async () => {
    queueFill([submissionRow('sub1', 'draft')], [answerRow('q2', 'not a number'), answerRow('hidden', 'x'), answerRow('q1', 'ok')]);
    expect((await getFillData('a1')).answers).toEqual({ q1: 'ok' });
  });

  it('handles missing submission and answer lists', async () => {
    queueFill(null as unknown as unknown[]); // PostgREST never returns null data without an error; covers the guard
    expect((await getFillData('a1')).answers).toEqual({});
    queueFill([submissionRow('sub1', 'draft')], null as unknown as unknown[]);
    expect((await getFillData('a1')).answers).toEqual({});
  });

  it('reports an assignment that is not theirs', async () => {
    queue(ok(null));
    expect(await codeOf(getFillData('nope'))).toBe('notFound');
  });

  it('reports a form that is not published (hidden by RLS)', async () => {
    queue(ok(assignmentRow), ok(null), ok([]), ok([]));
    expect(await codeOf(getFillData('a1'))).toBe('notFound');
  });

  it('maps errors in each query', async () => {
    queue(failure());
    expect(await codeOf(getFillData('a1'))).toBe('forbidden');
    queue(ok(assignmentRow), ok(formRow), ok([sectionRow]), ok([]), failure());
    expect(await codeOf(getFillData('a1'))).toBe('forbidden');
    queue(ok(assignmentRow), ok(formRow), ok([sectionRow]), ok([]), ok([submissionRow('sub1', 'draft')]), failure());
    expect(await codeOf(getFillData('a1'))).toBe('forbidden');
  });
});

describe('getOrCreateDraft', () => {
  it('returns the existing draft', async () => {
    queue(ok(submissionRow('sub1', 'draft')));
    await expect(getOrCreateDraft('a1')).resolves.toMatchObject({ id: 'sub1' });
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('starts a draft when there is none', async () => {
    const insert = ok(submissionRow('new', 'draft'));
    queue(ok(null), insert);

    await expect(getOrCreateDraft('a1')).resolves.toMatchObject({ id: 'new' });

    expect(insert.argsOf('insert')).toEqual([{ assignment_id: 'a1' }]);
  });

  it('says the form is closed when the database refuses a draft', async () => {
    queue(ok(null), failure('42501'));
    expect(await codeOf(getOrCreateDraft('a1'))).toBe('formClosed');
  });

  it('says the form was already submitted when only one response is allowed', async () => {
    queue(ok(null), failure('23505'));
    expect(await codeOf(getOrCreateDraft('a1'))).toBe('alreadySubmitted');
  });

  it('maps other errors and empty results', async () => {
    queue(failure('42501'));
    expect(await codeOf(getOrCreateDraft('a1'))).toBe('forbidden');
    queue(ok(null), fakeQuery({ data: null, error: { message: 'Failed to fetch' } }));
    expect(await codeOf(getOrCreateDraft('a1'))).toBe('network');
    queue(ok(null), ok(null));
    expect(await codeOf(getOrCreateDraft('a1'))).toBe('unknown');
  });
});

describe('saveAnswer', () => {
  it('upserts the answer on submission and question', async () => {
    const query = ok(null);
    queue(query);

    await saveAnswer('sub1', 'q1', 'hello');

    expect(mockFrom).toHaveBeenCalledWith('form_answers');
    expect(query.argsOf('upsert')).toEqual([
      { submission_id: 'sub1', question_id: 'q1', value: 'hello' },
      { onConflict: 'submission_id,question_id' },
    ]);
  });

  it('maps database errors', async () => {
    queue(failure('22023'));
    expect(await codeOf(saveAnswer('sub1', 'q1', 'x'))).toBe('invalidInput');
  });
});

describe('deleteAnswer', () => {
  it('deletes one answer', async () => {
    const query = ok(null);
    queue(query);
    await deleteAnswer('sub1', 'q1');
    expect(query.calls.filter((call) => call.method === 'eq').map((call) => call.args)).toEqual([
      ['submission_id', 'sub1'],
      ['question_id', 'q1'],
    ]);
  });

  it('maps database errors', async () => {
    queue(failure());
    expect(await codeOf(deleteAnswer('sub1', 'q1'))).toBe('forbidden');
  });
});

describe('submitSubmission', () => {
  it('marks the draft as submitted', async () => {
    const query = ok(submissionRow('sub1', 'submitted'));
    queue(query);

    const submission = await submitSubmission('sub1');

    expect(query.argsOf('update')).toEqual([{ status: 'submitted' }]);
    expect(submission.status).toBe('submitted');
  });

  it('reports missing required answers', async () => {
    queue(failure('23514'));
    expect(await codeOf(submitSubmission('sub1'))).toBe('missingRequired');
  });

  it('fails when nothing comes back', async () => {
    queue(ok(null));
    expect(await codeOf(submitSubmission('sub1'))).toBe('unknown');
  });
});

describe('reopenSubmission', () => {
  it('turns the response back into a draft', async () => {
    const query = ok(submissionRow('sub1', 'draft'));
    queue(query);

    const submission = await reopenSubmission('sub1');

    expect(query.argsOf('update')).toEqual([{ status: 'draft' }]);
    expect(submission.status).toBe('draft');
  });

  it('reports that editing is not allowed (the row is hidden from the update)', async () => {
    queue(failure('PGRST116'));
    expect(await codeOf(reopenSubmission('sub1'))).toBe('forbidden');
  });

  it('maps other errors and empty results', async () => {
    queue(fakeQuery({ data: null, error: { message: 'Failed to fetch' } }));
    expect(await codeOf(reopenSubmission('sub1'))).toBe('network');
    queue(ok(null));
    expect(await codeOf(reopenSubmission('sub1'))).toBe('unknown');
  });
});
