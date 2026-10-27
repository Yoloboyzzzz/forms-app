import {
  assignUsers,
  listFormAssignees,
  listMyAssignments,
  unassign,
  updateDueDate,
} from './assignmentService';
import { ServiceError } from './errors';
import { fakeQuery, type FakeQuery } from './testUtils/fakeQuery';

const mockFrom = jest.fn();

// Resolved lazily: the factory runs when the service is imported, before the const above is initialised.
jest.mock('@/services/supabase/client', () => ({ supabase: { from: (table: string) => mockFrom(table) } }));

const TS = '2026-10-27T10:00:00Z';
const assignmentRow = (id: string, userId: string, formId = 'f1', extra: object = {}) => ({
  id,
  form_id: formId,
  user_id: userId,
  assigned_by: 'admin',
  due_at: null,
  assigned_at: TS,
  ...extra,
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
const formRow = (id: string) => ({
  id,
  title: `Form ${id}`,
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
});
const submissionRow = (id: string, assignmentId: string, status: 'draft' | 'submitted') => ({
  id,
  assignment_id: assignmentId,
  status,
  submitted_at: status === 'submitted' ? TS : null,
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

beforeEach(() => jest.resetAllMocks());

describe('assignUsers', () => {
  it('assigns every user and skips those that already have the form', async () => {
    const query = ok(null);
    queue(query);

    await assignUsers('f1', ['u1', 'u2'], 'admin', new Date(TS));

    expect(mockFrom).toHaveBeenCalledWith('form_assignments');
    expect(query.argsOf('upsert')).toEqual([
      [
        { form_id: 'f1', user_id: 'u1', assigned_by: 'admin', due_at: TS.replace('Z', '.000Z') },
        { form_id: 'f1', user_id: 'u2', assigned_by: 'admin', due_at: TS.replace('Z', '.000Z') },
      ],
      { onConflict: 'form_id,user_id', ignoreDuplicates: true },
    ]);
  });

  it('works without a due date', async () => {
    const query = ok(null);
    queue(query);
    await assignUsers('f1', ['u1'], 'admin');
    expect(query.argsOf('upsert')?.[0]).toEqual([{ form_id: 'f1', user_id: 'u1', assigned_by: 'admin', due_at: null }]);
  });

  it('does nothing for an empty selection', async () => {
    await assignUsers('f1', [], 'admin');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('maps database errors', async () => {
    queue(failure());
    expect(await codeOf(assignUsers('f1', ['u1'], 'admin'))).toBe('forbidden');
  });
});

describe('updateDueDate', () => {
  it('sets and clears the due date', async () => {
    const set = ok(null);
    const clear = ok(null);
    queue(set, clear);

    await updateDueDate('a1', new Date(TS));
    await updateDueDate('a1');

    expect(set.argsOf('update')).toEqual([{ due_at: new Date(TS).toISOString() }]);
    expect(set.argsOf('eq')).toEqual(['id', 'a1']);
    expect(clear.argsOf('update')).toEqual([{ due_at: null }]);
  });

  it('maps database errors', async () => {
    queue(failure());
    expect(await codeOf(updateDueDate('a1'))).toBe('forbidden');
  });
});

describe('unassign', () => {
  it('deletes the assignment', async () => {
    const query = ok(null);
    queue(query);
    await unassign('a1');
    expect(query.argsOf('eq')).toEqual(['id', 'a1']);
  });

  it('maps database errors', async () => {
    queue(failure());
    expect(await codeOf(unassign('a1'))).toBe('forbidden');
  });
});

describe('listFormAssignees', () => {
  it('joins assignments with their users, sorted by name', async () => {
    const profiles = ok([profileRow('u2', 'Bob'), profileRow('u1', 'Ann')]);
    queue(ok([assignmentRow('a1', 'u2'), assignmentRow('a2', 'u1')]), profiles);

    const assignees = await listFormAssignees('f1');

    expect(profiles.argsOf('in')).toEqual(['id', ['u2', 'u1']]);
    expect(assignees.map((item) => item.user.fullName)).toEqual(['Ann', 'Bob']);
    expect(assignees[0].assignment.id).toBe('a2');
  });

  it('returns nothing for a form without assignments, without asking for profiles', async () => {
    queue(ok([]));
    await expect(listFormAssignees('f1')).resolves.toEqual([]);
    expect(mockFrom).toHaveBeenCalledTimes(1);
    queue(ok(null));
    await expect(listFormAssignees('f1')).resolves.toEqual([]);
  });

  it('skips assignments whose user cannot be found', async () => {
    queue(ok([assignmentRow('a1', 'u1'), assignmentRow('a2', 'ghost')]), ok([profileRow('u1', 'Ann')]));
    const assignees = await listFormAssignees('f1');
    expect(assignees.map((item) => item.assignment.id)).toEqual(['a1']);
  });

  it('handles a missing profile list', async () => {
    queue(ok([assignmentRow('a1', 'u1')]), ok(null));
    await expect(listFormAssignees('f1')).resolves.toEqual([]);
  });

  it('maps errors in both queries', async () => {
    queue(failure());
    expect(await codeOf(listFormAssignees('f1'))).toBe('forbidden');
    queue(ok([assignmentRow('a1', 'u1')]), failure());
    expect(await codeOf(listFormAssignees('f1'))).toBe('forbidden');
  });
});

describe('listMyAssignments', () => {
  it('combines assignments with forms and response status', async () => {
    queue(
      ok([assignmentRow('a1', 'me', 'f1'), assignmentRow('a2', 'me', 'f2', { due_at: TS })]),
      ok([formRow('f1'), formRow('f2')]),
      ok([submissionRow('s1', 'a1', 'submitted')]),
    );

    const mine = await listMyAssignments('me');

    expect(mine.map((item) => [item.assignment.id, item.form.id, item.submission?.status])).toEqual([
      ['a1', 'f1', 'submitted'],
      ['a2', 'f2', undefined],
    ]);
    expect(mine[1].assignment.dueAt).toEqual(new Date(TS));
  });

  it('hides assignments whose form is not visible (not published)', async () => {
    queue(ok([assignmentRow('a1', 'me', 'f1'), assignmentRow('a2', 'me', 'hidden')]), ok([formRow('f1')]), ok([]));
    const mine = await listMyAssignments('me');
    expect(mine.map((item) => item.assignment.id)).toEqual(['a1']);
  });

  it('prefers a submitted response over a draft', async () => {
    queue(
      ok([assignmentRow('a1', 'me')]),
      ok([formRow('f1')]),
      ok([submissionRow('draft', 'a1', 'draft'), submissionRow('done', 'a1', 'submitted'), submissionRow('draft2', 'a1', 'draft')]),
    );
    const mine = await listMyAssignments('me');
    expect(mine[0].submission?.id).toBe('done');
  });

  it('shows a draft when nothing was submitted', async () => {
    queue(ok([assignmentRow('a1', 'me')]), ok([formRow('f1')]), ok([submissionRow('draft', 'a1', 'draft')]));
    const mine = await listMyAssignments('me');
    expect(mine[0].submission).toMatchObject({ id: 'draft', status: 'draft' });
  });

  it('returns nothing without assignments', async () => {
    queue(ok([]));
    await expect(listMyAssignments('me')).resolves.toEqual([]);
    queue(ok(null));
    await expect(listMyAssignments('me')).resolves.toEqual([]);
  });

  it('handles missing form and submission lists', async () => {
    queue(ok([assignmentRow('a1', 'me')]), ok(null), ok(null));
    await expect(listMyAssignments('me')).resolves.toEqual([]);
  });

  it.each([0, 1, 2])('maps an error in query %i', async (index) => {
    const queries = [ok([assignmentRow('a1', 'me')]), ok([formRow('f1')]), ok([])];
    queries[index] = failure();
    queue(...queries);
    expect(await codeOf(listMyAssignments('me'))).toBe('forbidden');
  });
});
