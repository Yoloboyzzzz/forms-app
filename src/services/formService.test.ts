import { ServiceError } from './errors';
import {
  archiveForm,
  createForm,
  deleteForm,
  duplicateForm,
  getFormDetail,
  listForms,
  publishForm,
  updateForm,
} from './formService';
import { fakeQuery, type FakeQuery } from './testUtils/fakeQuery';

const mockFrom = jest.fn();

// Resolved lazily: the factory runs when the service is imported, before the const above is initialised.
jest.mock('@/services/supabase/client', () => ({ supabase: { from: (table: string) => mockFrom(table) } }));

const TS = '2026-10-27T10:00:00Z';
const formRow = {
  id: 'f1',
  title: 'Feedback',
  description: 'About us',
  status: 'draft',
  is_accepting_responses: true,
  closes_at: null,
  limit_one_response: true,
  allow_edit_after_submit: false,
  shuffle_question_order: false,
  show_progress_bar: true,
  confirmation_message: null,
  created_by: 'u1',
  published_at: null,
  created_at: TS,
  updated_at: TS,
};
const sectionRow = (id: string, order: number, extra: object = {}) => ({
  id,
  form_id: 'f1',
  title: `Section ${id}`,
  description: null,
  order_index: order,
  after_action: 'next',
  go_to_section_id: null,
  created_at: TS,
  updated_at: TS,
  ...extra,
});
const questionRow = (id: string, sectionId: string, extra: object = {}) => ({
  id,
  form_id: 'f1',
  section_id: sectionId,
  title: `Question ${id}`,
  description: null,
  question_type: 'short_answer',
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

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof ServiceError ? error.code : 'not-a-service-error';
  }
}

/** Queues the query builders in the order the service will ask for them. */
function queue(...queries: FakeQuery[]): void {
  queries.forEach((query) => mockFrom.mockReturnValueOnce(query.builder));
}

const ok = (data: unknown, extra: object = {}) => fakeQuery({ data, error: null, ...extra });

beforeEach(() => jest.resetAllMocks());

describe('listForms', () => {
  it('lists forms, newest change first', async () => {
    const query = ok([formRow]);
    queue(query);

    const forms = await listForms();

    expect(mockFrom).toHaveBeenCalledWith('forms');
    expect(query.argsOf('order')).toEqual(['updated_at', { ascending: false }]);
    expect(query.argsOf('eq')).toBeUndefined();
    expect(forms).toHaveLength(1);
  });

  it('can filter by status', async () => {
    const query = ok([]);
    queue(query);
    await listForms('archived');
    expect(query.argsOf('eq')).toEqual(['status', 'archived']);
  });

  it('maps database errors and handles no data', async () => {
    queue(fakeQuery({ data: null, error: { code: '42501', message: 'x' } }));
    expect(await codeOf(listForms())).toBe('forbidden');
    queue(ok(null));
    await expect(listForms()).resolves.toEqual([]);
  });
});

describe('getFormDetail', () => {
  it('loads the form with sections and questions', async () => {
    queue(ok(formRow), ok([sectionRow('s1', 0)]), ok([questionRow('q1', 's1')]));

    const detail = await getFormDetail('f1');

    expect(detail.form.id).toBe('f1');
    expect(detail.sections.map((section) => section.id)).toEqual(['s1']);
    expect(detail.questions.map((question) => question.id)).toEqual(['q1']);
  });

  it('handles empty section and question lists', async () => {
    queue(ok(formRow), ok(null), ok(null));
    const detail = await getFormDetail('f1');
    expect(detail.sections).toEqual([]);
    expect(detail.questions).toEqual([]);
  });

  it('reports a missing form', async () => {
    queue(ok(null), ok([]), ok([]));
    expect(await codeOf(getFormDetail('nope'))).toBe('notFound');
  });

  it.each([0, 1, 2])('maps an error in query %i', async (index) => {
    const results = [ok(formRow), ok([]), ok([])];
    results[index] = fakeQuery({ data: null, error: { code: '42501', message: 'x' } });
    queue(...results);
    expect(await codeOf(getFormDetail('f1'))).toBe('forbidden');
  });
});

describe('createForm', () => {
  it('inserts a draft for the owner', async () => {
    const query = ok(formRow);
    queue(query);

    const form = await createForm({ title: 'Feedback', description: 'About us' }, 'u1');

    expect(query.argsOf('insert')).toEqual([{ title: 'Feedback', description: 'About us', created_by: 'u1' }]);
    expect(form).toMatchObject({ id: 'f1', status: 'draft' });
  });

  it('maps database errors and empty results', async () => {
    queue(fakeQuery({ data: null, error: { code: '42501', message: 'x' } }));
    expect(await codeOf(createForm({ title: 'T' }, 'u1'))).toBe('forbidden');
    queue(ok(null));
    expect(await codeOf(createForm({ title: 'T' }, 'u1'))).toBe('unknown');
  });
});

describe('updateForm', () => {
  it('sends only the patched fields', async () => {
    const query = ok({ ...formRow, title: 'New' });
    queue(query);

    const form = await updateForm('f1', { title: 'New', showProgressBar: false });

    expect(query.argsOf('update')).toEqual([{ title: 'New', show_progress_bar: false }]);
    expect(query.argsOf('eq')).toEqual(['id', 'f1']);
    expect(form.title).toBe('New');
  });

  it('maps database errors and empty results', async () => {
    queue(fakeQuery({ data: null, error: { message: 'Failed to fetch' } }));
    expect(await codeOf(updateForm('f1', {}))).toBe('network');
    queue(ok(null));
    expect(await codeOf(updateForm('f1', {}))).toBe('unknown');
  });
});

describe('publishForm', () => {
  it('publishes a form with an active question', async () => {
    const count = ok(null, { count: 2 });
    const update = ok({ ...formRow, status: 'published', published_at: TS });
    queue(count, update);

    const form = await publishForm('f1');

    expect(count.argsOf('select')).toEqual(['id', { count: 'exact', head: true }]);
    expect(update.argsOf('update')?.[0]).toMatchObject({ status: 'published' });
    expect(form.status).toBe('published');
  });

  it('refuses a form without active questions', async () => {
    queue(ok(null, { count: 0 }));
    expect(await codeOf(publishForm('f1'))).toBe('invalidInput');
    queue(ok(null, { count: null }));
    expect(await codeOf(publishForm('f1'))).toBe('invalidInput');
  });

  it('maps database errors and empty results', async () => {
    queue(fakeQuery({ data: null, error: { code: '42501', message: 'x' } }));
    expect(await codeOf(publishForm('f1'))).toBe('forbidden');
    queue(ok(null, { count: 1 }), fakeQuery({ data: null, error: { code: '42501', message: 'x' } }));
    expect(await codeOf(publishForm('f1'))).toBe('forbidden');
    queue(ok(null, { count: 1 }), ok(null));
    expect(await codeOf(publishForm('f1'))).toBe('unknown');
  });
});

describe('archiveForm', () => {
  it('sets the archived status', async () => {
    const query = ok({ ...formRow, status: 'archived' });
    queue(query);

    const form = await archiveForm('f1');

    expect(query.argsOf('update')).toEqual([{ status: 'archived' }]);
    expect(form.status).toBe('archived');
  });

  it('maps database errors and empty results', async () => {
    queue(fakeQuery({ data: null, error: { code: '42501', message: 'x' } }));
    expect(await codeOf(archiveForm('f1'))).toBe('forbidden');
    queue(ok(null));
    expect(await codeOf(archiveForm('f1'))).toBe('unknown');
  });
});

describe('deleteForm', () => {
  it('deletes a form without responses', async () => {
    const query = ok(null);
    queue(query);
    await deleteForm('f1');
    expect(query.argsOf('eq')).toEqual(['id', 'f1']);
  });

  it('refuses a form that has answers', async () => {
    queue(fakeQuery({ data: null, error: { code: '23503', message: 'fk' } }));
    expect(await codeOf(deleteForm('f1'))).toBe('inUse');
  });
});

describe('duplicateForm', () => {
  const choiceOptions = [
    { id: 'o1', label: 'Yes', goTo: 's2' },
    { id: 'o2', label: 'No', goTo: 'submit' },
    { id: 'o3', label: 'Maybe', goTo: null },
  ];

  /** Source form with two sections, branching, one active and one deactivated question. */
  function queueSource(): void {
    queue(
      ok(formRow),
      ok([sectionRow('s1', 0), sectionRow('s2', 1, { after_action: 'goto', go_to_section_id: 's1' })]),
      ok([
        questionRow('q1', 's1', { question_type: 'multiple_choice', options: choiceOptions }),
        questionRow('q2', 's2', { is_active: false }),
        questionRow('q3', 's2'),
      ]),
    );
  }

  it('copies settings, sections, jumps and active questions into a new draft', async () => {
    queueSource();
    const newForm = ok({ ...formRow, id: 'f2', title: 'Copy' });
    const autoSection = ok([sectionRow('a1', 0, { form_id: 'f2' })]);
    const updateFirst = ok(null);
    const insertSecond = ok({ id: 'a2' });
    const jump = ok(null);
    const questions = ok(null);
    queue(newForm, autoSection, updateFirst, insertSecond, jump, questions);

    const copy = await duplicateForm('f1', 'Copy', 'u9');

    expect(newForm.argsOf('insert')?.[0]).toMatchObject({ title: 'Copy', created_by: 'u9', limit_one_response: true });
    expect(updateFirst.argsOf('update')).toEqual([{ title: 'Section s1', description: null, order_index: 0 }]);
    expect(updateFirst.argsOf('eq')).toEqual(['id', 'a1']);
    expect(insertSecond.argsOf('insert')).toEqual([
      { form_id: 'f2', title: 'Section s2', description: null, order_index: 1 },
    ]);
    // section s2 jumped back to s1: the copy jumps back to the copied first section
    expect(jump.argsOf('update')).toEqual([{ after_action: 'goto', go_to_section_id: 'a1' }]);
    expect(jump.argsOf('eq')).toEqual(['id', 'a2']);

    const rows = questions.argsOf('insert')?.[0];
    expect(rows).toHaveLength(2);
    expect(rows).toMatchObject([
      {
        form_id: 'f2',
        section_id: 'a1',
        options: [
          { id: 'o1', label: 'Yes', goTo: 'a2' },
          { id: 'o2', label: 'No', goTo: 'submit' },
          { id: 'o3', label: 'Maybe', goTo: null },
        ],
      },
      { form_id: 'f2', section_id: 'a2', title: 'Question q3' },
    ]);
    expect(copy.id).toBe('f2');
  });

  it('keeps branching targets that no longer exist as no jump', async () => {
    queue(
      ok(formRow),
      ok([sectionRow('s1', 0)]),
      ok([questionRow('q1', 's1', { question_type: 'dropdown', options: [{ id: 'o1', label: 'A', goTo: 'gone' }] })]),
    );
    const questions = ok(null);
    queue(ok({ ...formRow, id: 'f2' }), ok([sectionRow('a1', 0)]), ok(null), questions);

    await duplicateForm('f1', 'Copy', 'u9');

    expect(questions.argsOf('insert')?.[0]).toMatchObject([{ options: [{ id: 'o1', goTo: null }] }]);
  });

  it('skips the question insert when no question is active', async () => {
    queue(ok(formRow), ok([sectionRow('s1', 0)]), ok([questionRow('q1', 's1', { is_active: false })]));
    queue(ok({ ...formRow, id: 'f2' }), ok([sectionRow('a1', 0)]), ok(null));

    await duplicateForm('f1', 'Copy', 'u9');

    expect(mockFrom).toHaveBeenCalledTimes(6);
  });

  it('fails when the copy has no first section', async () => {
    queue(ok(formRow), ok([sectionRow('s1', 0)]), ok([]));
    queue(ok({ ...formRow, id: 'f2' }), ok([]));
    expect(await codeOf(duplicateForm('f1', 'Copy', 'u9'))).toBe('unknown');
  });

  it('fails when the form row cannot be created', async () => {
    queue(ok(formRow), ok([]), ok([]));
    queue(fakeQuery({ data: null, error: { code: '42501', message: 'x' } }));
    expect(await codeOf(duplicateForm('f1', 'Copy', 'u9'))).toBe('forbidden');
    queue(ok(formRow), ok([]), ok([]));
    queue(ok(null));
    expect(await codeOf(duplicateForm('f1', 'Copy', 'u9'))).toBe('unknown');
  });

  it('maps errors in each following step', async () => {
    const failure = () => fakeQuery({ data: null, error: { code: '42501', message: 'x' } });
    const steps: FakeQuery[][] = [
      [failure()], // loading the auto-created section
      [ok([sectionRow('a1', 0)]), failure()], // updating the first section
      [ok([sectionRow('a1', 0)]), ok(null), failure()], // inserting another section
      [ok([sectionRow('a1', 0)]), ok(null), ok({ id: 'a2' }), failure()], // setting a jump
      [ok([sectionRow('a1', 0)]), ok(null), ok({ id: 'a2' }), ok(null), failure()], // inserting questions
    ];
    for (const [index, followUp] of steps.entries()) {
      queue(
        ok(formRow),
        ok([sectionRow('s1', 0), sectionRow('s2', 1, { after_action: 'submit' })]),
        ok([questionRow('q1', 's1')]),
        ok({ ...formRow, id: 'f2' }),
        ...followUp,
      );
      expect([index, await codeOf(duplicateForm('f1', 'Copy', 'u9'))]).toEqual([index, 'forbidden']);
      jest.resetAllMocks();
    }
  });

  it('fails when a copied section id is missing', async () => {
    queue(ok(formRow), ok([sectionRow('s1', 0)]), ok([questionRow('q1', 'orphan')]));
    queue(ok({ ...formRow, id: 'f2' }), ok([sectionRow('a1', 0)]), ok(null));
    expect(await codeOf(duplicateForm('f1', 'Copy', 'u9'))).toBe('unknown');
  });

  it('fails when an inserted section comes back empty', async () => {
    queue(ok(formRow), ok([sectionRow('s1', 0), sectionRow('s2', 1)]), ok([]));
    queue(ok({ ...formRow, id: 'f2' }), ok([sectionRow('a1', 0)]), ok(null), ok(null));
    expect(await codeOf(duplicateForm('f1', 'Copy', 'u9'))).toBe('unknown');
  });
});
