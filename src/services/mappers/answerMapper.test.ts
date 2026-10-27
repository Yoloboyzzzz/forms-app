import type { AnswerRow } from '@/types/database';
import { parseAnswerValue, toAnswer, toAnswerPayload } from './answerMapper';

describe('parseAnswerValue', () => {
  it.each([
    ['short_answer', 'hi', 'hi'],
    ['paragraph', 'long', 'long'],
    ['date', '2026-10-27', '2026-10-27'],
    ['time', '14:30', '14:30'],
    ['linear_scale', 4, 4],
    ['rating', 5, 5],
    ['multiple_choice', { optionId: 'o1' }, { optionId: 'o1' }],
    ['multiple_choice', { other: 'x' }, { other: 'x' }],
    ['dropdown', { optionId: 'o1' }, { optionId: 'o1' }],
    ['checkboxes', { optionIds: ['a', 'b'], other: 'z' }, { optionIds: ['a', 'b'], other: 'z' }],
    ['multiple_choice_grid', { r1: 'c1' }, { r1: 'c1' }],
    ['checkbox_grid', { r1: ['c1', 'c2'] }, { r1: ['c1', 'c2'] }],
    ['file_upload', ['a/b.pdf'], ['a/b.pdf']],
  ] as const)('parses %s', (type, raw, expected) => {
    expect(parseAnswerValue(type, raw)).toEqual(expected);
  });

  it.each([
    ['short_answer', 5],
    ['date', null],
    ['linear_scale', '4'],
    ['rating', Infinity],
    ['multiple_choice', 'o1'],
    ['multiple_choice', { nothing: 1 }],
    ['dropdown', { optionId: 1 }],
    ['dropdown', 'x'],
    ['checkboxes', ['a']],
    ['checkboxes', { optionIds: 'a' }],
    ['multiple_choice_grid', { r1: 1 }],
    ['multiple_choice_grid', 'x'],
    ['checkbox_grid', { r1: 'c1' }],
    ['checkbox_grid', null],
    ['file_upload', [1]],
    ['file_upload', 'a'],
  ] as const)('rejects invalid %s value %j', (type, raw) => {
    expect(parseAnswerValue(type, raw)).toBeUndefined();
  });
});

describe('toAnswer', () => {
  const row: AnswerRow = {
    id: 'a1',
    submission_id: 's1',
    question_id: 'q1',
    value: 'hello',
    created_at: '2026-10-27T10:00:00Z',
    updated_at: '2026-10-27T11:00:00Z',
  };

  it('maps a valid row', () => {
    const answer = toAnswer(row, 'short_answer');
    expect(answer).toMatchObject({ id: 'a1', submissionId: 's1', questionId: 'q1', value: 'hello' });
    expect(answer?.updatedAt.toISOString()).toBe('2026-10-27T11:00:00.000Z');
  });

  it('returns undefined when the value does not fit the type', () => {
    expect(toAnswer(row, 'linear_scale')).toBeUndefined();
  });
});

describe('toAnswerPayload', () => {
  it('builds an upsert payload', () => {
    expect(toAnswerPayload('s1', 'q1', { optionIds: ['a'] })).toEqual({
      submission_id: 's1',
      question_id: 'q1',
      value: { optionIds: ['a'] },
    });
  });
});
