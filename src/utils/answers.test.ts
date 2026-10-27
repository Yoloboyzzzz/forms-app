import { makeQuestion } from '@/testUtils/factories';
import type { AnswerValue, Question } from '@/types/models';
import {
  getAnswerError,
  getSectionErrors,
  isAnswered,
  readCheckboxes,
  readChoice,
  readGrid,
  readNumber,
  readText,
} from './answers';

describe('isAnswered', () => {
  it.each<[string, AnswerValue | undefined, boolean]>([
    ['no value', undefined, false],
    ['empty text', '', false],
    ['blank text', '   ', false],
    ['text', 'hi', true],
    ['zero', 0, true],
    ['a number', 4, true],
    ['an empty list', [], false],
    ['uploaded files', ['a/b.pdf'], true],
    ['a picked option', { optionId: 'o1' }, true],
    ['an empty option id', { optionId: '' }, false],
    ['an other answer', { other: 'x' }, true],
    ['a blank other answer', { other: ' ' }, false],
    ['ticked boxes', { optionIds: ['a'] }, true],
    ['nothing ticked', { optionIds: [] }, false],
    ['nothing ticked but other filled', { optionIds: [], other: 'x' }, true],
    ['an answered grid', { r1: 'c1' }, true],
    ['an empty grid', {}, false],
    ['a checkbox grid with only empty rows', { r1: [] }, false],
    ['a checkbox grid with a tick', { r1: ['c1'] }, true],
  ])('%s', (_name, value, expected) => {
    expect(isAnswered(value)).toBe(expected);
  });
});

describe('getAnswerError', () => {
  const required = (overrides: Parameters<typeof makeQuestion>[1] = {}) => makeQuestion('q1', { isRequired: true, ...overrides });

  it('requires an answer for required questions', () => {
    expect(getAnswerError(required(), undefined)).toEqual({ kind: 'required' });
    expect(getAnswerError(required(), '  ')).toEqual({ kind: 'required' });
  });

  it('does not need an answer for optional questions', () => {
    expect(getAnswerError(makeQuestion('q1'), undefined)).toBeUndefined();
  });

  it('never fails a deactivated question', () => {
    expect(getAnswerError(required({ isActive: false }), undefined)).toBeUndefined();
  });

  it('applies the text rule of short answers and paragraphs', () => {
    const rule = { kind: 'length', operator: 'max', value: 3 } as const;
    expect(getAnswerError(makeQuestion('q1', { settings: { validation: rule } }), 'abcd')).toMatchObject({
      kind: 'rule',
      failure: { defaultKey: 'validation.rule.length.max' },
    });
    expect(getAnswerError(makeQuestion('q1', { settings: { validation: rule } }), 'abc')).toBeUndefined();
    expect(
      getAnswerError(makeQuestion('q1', { questionType: 'paragraph', settings: { validation: rule } }), 'abcd'),
    ).toMatchObject({ kind: 'rule' });
  });

  it('accepts text without a rule', () => {
    expect(getAnswerError(makeQuestion('q1'), 'anything')).toBeUndefined();
  });

  it('counts ticked boxes, including the other answer, against the selection rule', () => {
    const question = makeQuestion('q1', {
      questionType: 'checkboxes',
      options: [{ id: 'a', label: 'A' }],
      settings: { validation: { kind: 'checkboxCount', operator: 'atLeast', value: 2 } },
    });
    expect(getAnswerError(question, { optionIds: ['a'] })).toMatchObject({ kind: 'rule' });
    expect(getAnswerError(question, { optionIds: ['a'], other: 'x' })).toBeUndefined();
    expect(getAnswerError(question, { optionIds: ['a', 'b'] })).toBeUndefined();
  });

  it('accepts checkboxes without a rule and values of the wrong shape', () => {
    const plain = makeQuestion('q1', { questionType: 'checkboxes', options: [], settings: {} });
    expect(getAnswerError(plain, { optionIds: ['a'] })).toBeUndefined();
    const ruled = makeQuestion('q1', {
      questionType: 'checkboxes',
      options: [],
      settings: { validation: { kind: 'checkboxCount', operator: 'atLeast', value: 2 } },
    });
    expect(getAnswerError(ruled, 'text')).toBeUndefined();
    expect(getAnswerError(ruled, { optionId: 'x' })).toBeUndefined();
  });

  it.each<[Question['questionType'], AnswerValue]>([
    ['multiple_choice', { optionId: 'o1' }],
    ['dropdown', { optionId: 'o1' }],
    ['linear_scale', 3],
    ['rating', 3],
    ['date', '2026-11-04'],
    ['time', '10:30'],
    ['file_upload', ['a.pdf']],
  ])('accepts an answer to a %s question', (type, value) => {
    const question = makeQuestion('q1', { questionType: type } as Parameters<typeof makeQuestion>[1]); // options are not read by this check
    expect(getAnswerError(question, value)).toBeUndefined();
  });
});

describe('getAnswerError: grids', () => {
  const rows = [
    { id: 'r1', label: 'Row 1' },
    { id: 'r2', label: 'Row 2' },
  ];
  const columns = [
    { id: 'c1', label: 'Col 1' },
    { id: 'c2', label: 'Col 2' },
  ];
  const grid = (type: 'multiple_choice_grid' | 'checkbox_grid', settings = {}, extra = {}) =>
    makeQuestion('g', { questionType: type, options: { rows, columns }, settings, ...extra });

  it('needs at least one row answered when required', () => {
    expect(getAnswerError(grid('multiple_choice_grid', {}, { isRequired: true }), undefined)).toEqual({ kind: 'required' });
    expect(getAnswerError(grid('multiple_choice_grid', {}, { isRequired: true }), { r1: 'c1' })).toBeUndefined();
  });

  it('can require every row, only for required questions', () => {
    const question = grid('multiple_choice_grid', { requireEachRow: true }, { isRequired: true });
    expect(getAnswerError(question, { r1: 'c1' })).toEqual({ kind: 'grid', reason: 'eachRow' });
    expect(getAnswerError(question, { r1: 'c1', r2: 'c2' })).toBeUndefined();
    expect(getAnswerError(grid('multiple_choice_grid', { requireEachRow: true }), { r1: 'c1' })).toBeUndefined();
  });

  it('treats a checkbox grid row without ticks as unanswered', () => {
    const question = grid('checkbox_grid', { requireEachRow: true }, { isRequired: true });
    expect(getAnswerError(question, { r1: ['c1'], r2: [] })).toEqual({ kind: 'grid', reason: 'eachRow' });
    expect(getAnswerError(question, { r1: ['c1'], r2: ['c1', 'c2'] })).toBeUndefined();
  });

  it('can limit each column to one row', () => {
    const question = grid('multiple_choice_grid', { limitOnePerColumn: true });
    expect(getAnswerError(question, { r1: 'c1', r2: 'c1' })).toEqual({ kind: 'grid', reason: 'onePerColumn' });
    expect(getAnswerError(question, { r1: 'c1', r2: 'c2' })).toBeUndefined();
  });

  it('accepts grids without rules and answers of another shape', () => {
    expect(getAnswerError(grid('checkbox_grid'), { r1: ['c1'] })).toBeUndefined();
    // an answer of the wrong shape counts as no row answered
    expect(getAnswerError(grid('multiple_choice_grid', { requireEachRow: true }, { isRequired: true }), 'x')).toEqual({
      kind: 'grid',
      reason: 'eachRow',
    });
  });
});

describe('getSectionErrors', () => {
  const questions = [
    makeQuestion('a', { isRequired: true }),
    makeQuestion('b', { isRequired: true, sectionId: 's2' }),
    makeQuestion('c', { settings: { validation: { kind: 'length', operator: 'max', value: 1 } } }),
  ];

  it('collects the errors of one section only', () => {
    const errors = getSectionErrors(questions, 's1', { c: 'toolong' });
    expect(Object.keys(errors).sort()).toEqual(['a', 'c']);
    expect(errors.a).toEqual({ kind: 'required' });
  });

  it('is empty when everything is fine', () => {
    expect(getSectionErrors(questions, 's1', { a: 'x', c: 'y' })).toEqual({});
  });
});

describe('readGrid', () => {
  it('reads one column per row of a single choice grid and the ticks of a checkbox grid', () => {
    expect(readGrid({ r1: 'c1', r2: '' })).toEqual({ r1: ['c1'], r2: [] });
    expect(readGrid({ r1: ['c1', 'c2'], r2: [] })).toEqual({ r1: ['c1', 'c2'], r2: [] });
  });

  it('is empty for other shapes', () => {
    expect(readGrid(undefined)).toEqual({});
    expect(readGrid('x')).toEqual({});
    expect(readGrid(['a'])).toEqual({});
    expect(readGrid(4)).toEqual({});
  });
});

describe('answer readers', () => {
  it('reads text', () => {
    expect(readText('hi')).toBe('hi');
    expect(readText(undefined)).toBe('');
    expect(readText(4)).toBe('');
  });

  it('reads numbers', () => {
    expect(readNumber(4)).toBe(4);
    expect(readNumber(0)).toBe(0);
    expect(readNumber('4')).toBeUndefined();
    expect(readNumber(undefined)).toBeUndefined();
  });

  it('reads a choice, with the picked option or the other text', () => {
    expect(readChoice({ optionId: 'o1' })).toEqual({ optionId: 'o1', other: undefined });
    expect(readChoice({ other: 'x' })).toEqual({ optionId: undefined, other: 'x' });
    expect(readChoice('text')).toEqual({});
    expect(readChoice(undefined)).toEqual({});
    expect(readChoice(['a'])).toEqual({});
  });

  it('reads ticked boxes', () => {
    expect(readCheckboxes({ optionIds: ['a'], other: 'x' })).toEqual({ optionIds: ['a'], other: 'x' });
    expect(readCheckboxes({ optionIds: ['a'] })).toEqual({ optionIds: ['a'], other: undefined });
    expect(readCheckboxes(undefined)).toEqual({ optionIds: [] });
    expect(readCheckboxes('x')).toEqual({ optionIds: [] });
    expect(readCheckboxes(['a'])).toEqual({ optionIds: [] });
    expect(readCheckboxes({ optionId: 'a' })).toEqual({ optionIds: [] });
  });
});
