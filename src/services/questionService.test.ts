import { ServiceError } from './errors';
import {
  addQuestion,
  duplicateQuestion,
  removeQuestion,
  reorderQuestions,
  setQuestionActive,
  updateQuestion,
} from './questionService';
import { fakeQuery } from './testUtils/fakeQuery';
import type { Question, QuestionDraft } from '../types/models';

const mockFrom = jest.fn();

// Resolved lazily: the factory runs when the service is imported, before the const above is initialised.
jest.mock('@/services/supabase/client', () => ({ supabase: { from: (table: string) => mockFrom(table) } }));

const TS = '2026-10-27T10:00:00Z';
const row = {
  id: 'q1',
  form_id: 'f1',
  section_id: 's1',
  title: 'Name',
  description: null,
  question_type: 'short_answer',
  is_required: true,
  options: null,
  settings: {},
  image_path: null,
  order_index: 0,
  is_active: true,
  created_at: TS,
  updated_at: TS,
};

const draft: QuestionDraft = {
  formId: 'f1',
  sectionId: 's1',
  title: 'Name',
  isRequired: true,
  orderIndex: 0,
  isActive: true,
  questionType: 'short_answer',
  settings: {},
};

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof ServiceError ? error.code : 'not-a-service-error';
  }
}

beforeEach(() => jest.resetAllMocks());

describe('addQuestion', () => {
  it('inserts the payload and returns the question', async () => {
    const query = fakeQuery({ data: row, error: null });
    mockFrom.mockReturnValue(query.builder);

    const question = await addQuestion(draft);

    expect(mockFrom).toHaveBeenCalledWith('form_questions');
    expect(query.argsOf('insert')?.[0]).toMatchObject({
      form_id: 'f1',
      section_id: 's1',
      question_type: 'short_answer',
      is_required: true,
      options: null,
    });
    expect(question).toMatchObject({ id: 'q1', questionType: 'short_answer', title: 'Name' });
  });

  it('maps database errors and empty results', async () => {
    mockFrom.mockReturnValue(fakeQuery({ data: null, error: { code: '42501', message: 'x' } }).builder);
    expect(await codeOf(addQuestion(draft))).toBe('forbidden');
    mockFrom.mockReturnValue(fakeQuery({ data: null, error: null }).builder);
    expect(await codeOf(addQuestion(draft))).toBe('unknown');
  });
});

describe('updateQuestion', () => {
  it('saves the whole question', async () => {
    const query = fakeQuery({ data: { ...row, title: 'Full name' }, error: null });
    mockFrom.mockReturnValue(query.builder);

    const question = await updateQuestion('q1', { ...draft, title: 'Full name' });

    expect(query.argsOf('update')?.[0]).toMatchObject({ title: 'Full name' });
    expect(query.argsOf('eq')).toEqual(['id', 'q1']);
    expect(question.title).toBe('Full name');
  });

  it('maps database errors and empty results', async () => {
    mockFrom.mockReturnValue(fakeQuery({ data: null, error: { message: 'Failed to fetch' } }).builder);
    expect(await codeOf(updateQuestion('q1', draft))).toBe('network');
    mockFrom.mockReturnValue(fakeQuery({ data: null, error: null }).builder);
    expect(await codeOf(updateQuestion('q1', draft))).toBe('unknown');
  });
});

describe('reorderQuestions', () => {
  it('writes the position of every question', async () => {
    const queries = ['a', 'b'].map(() => fakeQuery({ data: null, error: null }));
    queries.forEach((query) => mockFrom.mockReturnValueOnce(query.builder));

    await reorderQuestions(['a', 'b']);

    expect(queries.map((query) => query.argsOf('update'))).toEqual([[{ order_index: 0 }], [{ order_index: 1 }]]);
  });

  it('fails when one update fails', async () => {
    mockFrom
      .mockReturnValueOnce(fakeQuery({ data: null, error: { code: '42501', message: 'x' } }).builder)
      .mockReturnValueOnce(fakeQuery({ data: null, error: null }).builder);
    expect(await codeOf(reorderQuestions(['a', 'b']))).toBe('forbidden');
  });
});

describe('duplicateQuestion', () => {
  it('inserts a copy directly after the original', async () => {
    const query = fakeQuery({ data: { ...row, id: 'q2', order_index: 4 }, error: null });
    mockFrom.mockReturnValue(query.builder);
    const original: Question = { ...draft, id: 'q1', orderIndex: 3 };

    const copy = await duplicateQuestion(original);

    expect(query.argsOf('insert')?.[0]).toMatchObject({ order_index: 4, section_id: 's1', title: 'Name' });
    expect(copy.id).toBe('q2');
  });
});

describe('setQuestionActive', () => {
  it('toggles the flag', async () => {
    const query = fakeQuery({ data: null, error: null });
    mockFrom.mockReturnValue(query.builder);

    await setQuestionActive('q1', false);

    expect(query.argsOf('update')).toEqual([{ is_active: false }]);
    expect(query.argsOf('eq')).toEqual(['id', 'q1']);
  });

  it('maps database errors', async () => {
    mockFrom.mockReturnValue(fakeQuery({ data: null, error: { code: '42501', message: 'x' } }).builder);
    expect(await codeOf(setQuestionActive('q1', true))).toBe('forbidden');
  });
});

describe('removeQuestion', () => {
  it('deletes a question without answers', async () => {
    mockFrom.mockReturnValue(fakeQuery({ data: null, error: null }).builder);
    await expect(removeQuestion('q1')).resolves.toBe('deleted');
  });

  it('deactivates a question that already has answers', async () => {
    const deletion = fakeQuery({ data: null, error: { code: '23503', message: 'fk' } });
    const deactivation = fakeQuery({ data: null, error: null });
    mockFrom.mockReturnValueOnce(deletion.builder).mockReturnValueOnce(deactivation.builder);

    await expect(removeQuestion('q1')).resolves.toBe('deactivated');

    expect(deactivation.argsOf('update')).toEqual([{ is_active: false }]);
  });

  it('reports other deletion errors', async () => {
    mockFrom.mockReturnValue(fakeQuery({ data: null, error: { code: '42501', message: 'x' } }).builder);
    expect(await codeOf(removeQuestion('q1'))).toBe('forbidden');
  });
});
