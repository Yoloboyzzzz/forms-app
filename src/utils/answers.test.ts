import { makeQuestion } from '@/testUtils/factories';
import type { AnswerValue, Question } from '@/types/models';
import { getAnswerError, getSectionErrors, isAnswered } from './answers';

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
    ['multiple_choice_grid', { r1: 'c1' }],
    ['checkbox_grid', { r1: ['c1'] }],
    ['date', '2026-11-04'],
    ['time', '10:30'],
    ['file_upload', ['a.pdf']],
  ])('accepts an answer to a %s question', (type, value) => {
    const question = makeQuestion('q1', { questionType: type } as Parameters<typeof makeQuestion>[1]); // options are not read by this check
    expect(getAnswerError(question, value)).toBeUndefined();
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
