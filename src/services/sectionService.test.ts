import { ServiceError } from './errors';
import { addSection, deleteSection, reorderSections, updateSection } from './sectionService';
import { fakeQuery } from './testUtils/fakeQuery';

const mockFrom = jest.fn();

// Resolved lazily: the factory runs when the service is imported, before the const above is initialised.
jest.mock('@/services/supabase/client', () => ({ supabase: { from: (table: string) => mockFrom(table) } }));

const TS = '2026-10-27T10:00:00Z';
const row = {
  id: 's1',
  form_id: 'f1',
  title: 'About you',
  description: null,
  order_index: 1,
  after_action: 'next',
  go_to_section_id: null,
  created_at: TS,
  updated_at: TS,
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

describe('addSection', () => {
  it('inserts the draft and returns the section', async () => {
    const query = fakeQuery({ data: row, error: null });
    mockFrom.mockReturnValue(query.builder);

    const section = await addSection({ formId: 'f1', title: 'About you', orderIndex: 1, afterAction: 'next' });

    expect(mockFrom).toHaveBeenCalledWith('form_sections');
    expect(query.argsOf('insert')).toEqual([
      {
        form_id: 'f1',
        title: 'About you',
        description: null,
        order_index: 1,
        after_action: 'next',
        go_to_section_id: null,
      },
    ]);
    expect(section).toMatchObject({ id: 's1', title: 'About you', orderIndex: 1 });
  });

  it('maps database errors', async () => {
    mockFrom.mockReturnValue(fakeQuery({ data: null, error: { code: '42501', message: 'x' } }).builder);
    expect(await codeOf(addSection({ formId: 'f1', orderIndex: 0, afterAction: 'next' }))).toBe('forbidden');
  });

  it('fails when nothing comes back', async () => {
    mockFrom.mockReturnValue(fakeQuery({ data: null, error: null }).builder);
    expect(await codeOf(addSection({ formId: 'f1', orderIndex: 0, afterAction: 'next' }))).toBe('unknown');
  });
});

describe('updateSection', () => {
  it('updates only the given fields of that section', async () => {
    const query = fakeQuery({ data: { ...row, after_action: 'goto', go_to_section_id: 's2' }, error: null });
    mockFrom.mockReturnValue(query.builder);

    const section = await updateSection('s1', { afterAction: 'goto', goToSectionId: 's2' });

    expect(query.argsOf('update')).toEqual([{ after_action: 'goto', go_to_section_id: 's2' }]);
    expect(query.argsOf('eq')).toEqual(['id', 's1']);
    expect(section).toMatchObject({ afterAction: 'goto', goToSectionId: 's2' });
  });

  it('maps database errors and empty results', async () => {
    mockFrom.mockReturnValue(fakeQuery({ data: null, error: { message: 'Failed to fetch' } }).builder);
    expect(await codeOf(updateSection('s1', {}))).toBe('network');
    mockFrom.mockReturnValue(fakeQuery({ data: null, error: null }).builder);
    expect(await codeOf(updateSection('s1', {}))).toBe('unknown');
  });
});

describe('reorderSections', () => {
  it('writes the position of every section', async () => {
    const queries = ['a', 'b', 'c'].map(() => fakeQuery({ data: null, error: null }));
    queries.forEach((query) => mockFrom.mockReturnValueOnce(query.builder));

    await reorderSections(['a', 'b', 'c']);

    expect(queries.map((query) => query.argsOf('update'))).toEqual([
      [{ order_index: 0 }],
      [{ order_index: 1 }],
      [{ order_index: 2 }],
    ]);
    expect(queries.map((query) => query.argsOf('eq'))).toEqual([
      ['id', 'a'],
      ['id', 'b'],
      ['id', 'c'],
    ]);
  });

  it('fails when one update fails', async () => {
    mockFrom
      .mockReturnValueOnce(fakeQuery({ data: null, error: null }).builder)
      .mockReturnValueOnce(fakeQuery({ data: null, error: { code: '42501', message: 'x' } }).builder);
    expect(await codeOf(reorderSections(['a', 'b']))).toBe('forbidden');
  });
});

describe('deleteSection', () => {
  it('deletes the section', async () => {
    const query = fakeQuery({ data: null, error: null });
    mockFrom.mockReturnValue(query.builder);
    await deleteSection('s1');
    expect(query.argsOf('eq')).toEqual(['id', 's1']);
  });

  it('refuses a section whose questions have answers', async () => {
    mockFrom.mockReturnValue(fakeQuery({ data: null, error: { code: '23503', message: 'fk' } }).builder);
    expect(await codeOf(deleteSection('s1'))).toBe('inUse');
  });
});
