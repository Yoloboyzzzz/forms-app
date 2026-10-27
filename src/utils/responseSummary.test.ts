import { makeQuestion } from '@/testUtils/factories';
import type { Question, ResponseAnswer } from '@/types/models';
import { describeAnswer, percentage, summarizeResponses } from './responseSummary';

const options = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
];
const answer = (submissionId: string, questionId: string, value: ResponseAnswer['value']): ResponseAnswer => ({
  submissionId,
  questionId,
  value,
});

const choice = makeQuestion('mc', { questionType: 'multiple_choice', options, settings: {} });
const boxes = makeQuestion('cb', { questionType: 'checkboxes', options, settings: {} });
const dropdown = makeQuestion('dd', { questionType: 'dropdown', options, settings: {} });
const scale = makeQuestion('ls', { questionType: 'linear_scale', settings: { min: 1, max: 3 } });
const text = makeQuestion('tx');

describe('summarizeResponses', () => {
  it('counts picked options of a multiple choice question and lists other answers', () => {
    const [summary] = summarizeResponses([choice], [
      answer('s1', 'mc', { optionId: 'a' }),
      answer('s2', 'mc', { optionId: 'a' }),
      answer('s3', 'mc', { optionId: 'b' }),
      answer('s4', 'mc', { other: ' Gamma ' }),
      answer('s5', 'mc', { other: ' ' }),
    ]);
    expect(summary).toMatchObject({
      kind: 'choice',
      total: 5,
      counts: [
        { id: 'a', count: 2 },
        { id: 'b', count: 1 },
      ],
      otherAnswers: ['Gamma'],
    });
  });

  it('counts every ticked box of a checkboxes question', () => {
    const [summary] = summarizeResponses([boxes], [
      answer('s1', 'cb', { optionIds: ['a', 'b'] }),
      answer('s2', 'cb', { optionIds: ['b'], other: 'x' }),
    ]);
    expect(summary).toMatchObject({ kind: 'choice', total: 2, counts: [{ count: 1 }, { count: 2 }], otherAnswers: ['x'] });
  });

  it('counts a dropdown', () => {
    const [summary] = summarizeResponses([dropdown], [answer('s1', 'dd', { optionId: 'b' })]);
    expect(summary).toMatchObject({ kind: 'choice', total: 1, counts: [{ count: 0 }, { count: 1 }] });
  });

  it('shows zero counts without answers', () => {
    const [summary] = summarizeResponses([choice], []);
    expect(summary).toMatchObject({ total: 0, counts: [{ count: 0 }, { count: 0 }], otherAnswers: [] });
  });

  it('gives the distribution and average of a scale', () => {
    const [summary] = summarizeResponses([scale], [answer('s1', 'ls', 1), answer('s2', 'ls', 3), answer('s3', 'ls', 3)]);
    expect(summary).toMatchObject({
      kind: 'scale',
      total: 3,
      average: 7 / 3,
      counts: [
        { value: 1, count: 1 },
        { value: 2, count: 0 },
        { value: 3, count: 2 },
      ],
    });
  });

  it('has no average without answers, and uses the default range', () => {
    const [summary] = summarizeResponses([makeQuestion('ls', { questionType: 'linear_scale', settings: {} })], []);
    expect(summary).toMatchObject({ kind: 'scale', total: 0, average: undefined });
    expect(summary.kind === 'scale' && summary.counts).toHaveLength(5);
  });

  it('collects text answers and skips blanks and answers of other shapes', () => {
    const [summary] = summarizeResponses([text], [answer('s1', 'tx', 'hello'), answer('s2', 'tx', '  '), answer('s3', 'tx', 5)]);
    expect(summary).toMatchObject({ kind: 'text', total: 1, answers: ['hello'] });
  });

  it('ignores answers to other questions and ignores non-numeric scale answers', () => {
    const summaries = summarizeResponses([scale, text], [answer('s1', 'tx', 'x'), answer('s1', 'ls', 'two')]);
    expect(summaries[0]).toMatchObject({ kind: 'scale', total: 0 });
    expect(summaries[1]).toMatchObject({ kind: 'text', total: 1 });
  });

  it('summarises ratings like a scale from 1 to the number of icons', () => {
    const rating = makeQuestion('rt', { questionType: 'rating', settings: { max: 4 } });
    const [summary] = summarizeResponses([rating], [answer('s1', 'rt', 4), answer('s2', 'rt', 2)]);
    expect(summary).toMatchObject({ kind: 'scale', total: 2, average: 3 });
    expect(summary.kind === 'scale' && summary.counts.map((entry) => entry.value)).toEqual([1, 2, 3, 4]);
  });

  it('lists time answers as text', () => {
    const time = makeQuestion('tm', { questionType: 'time', settings: {} });
    const [summary] = summarizeResponses([time], [answer('s1', 'tm', '14:30')]);
    expect(summary).toMatchObject({ kind: 'text', answers: ['14:30'] });
  });

  it('counts the columns picked in each row of a grid', () => {
    const options = {
      rows: [
        { id: 'r1', label: 'Food' },
        { id: 'r2', label: 'Service' },
      ],
      columns: [
        { id: 'c1', label: 'Good' },
        { id: 'c2', label: 'Bad' },
      ],
    };
    const mc = makeQuestion('gm', { questionType: 'multiple_choice_grid', options, settings: {} });
    const boxes = makeQuestion('gb', { questionType: 'checkbox_grid', options, settings: {} });
    const [single, multi] = summarizeResponses([mc, boxes], [
      answer('s1', 'gm', { r1: 'c1', r2: 'c2' }),
      answer('s2', 'gm', { r1: 'c1' }),
      answer('s1', 'gb', { r1: ['c1', 'c2'], r2: [] }),
    ]);
    expect(single).toMatchObject({
      kind: 'grid',
      total: 2,
      rows: [
        { label: 'Food', counts: [{ count: 2 }, { count: 0 }] },
        { label: 'Service', counts: [{ count: 0 }, { count: 1 }] },
      ],
    });
    expect(multi).toMatchObject({ rows: [{ counts: [{ count: 1 }, { count: 1 }] }, { counts: [{ count: 0 }, { count: 0 }] }] });
  });

  it('keeps the order of the questions', () => {
    expect(summarizeResponses([text, choice], []).map((summary) => summary.question.id)).toEqual(['tx', 'mc']);
  });

  it('has no summary yet for other question types', () => {
    const file = makeQuestion('f', { questionType: 'file_upload', settings: {} });
    summarizeResponses([file], []).forEach((summary) => expect(summary.kind).toBe('none'));
  });
});

describe('percentage', () => {
  it('rounds to a whole percentage', () => {
    expect(percentage(1, 3)).toBe(33);
    expect(percentage(2, 3)).toBe(67);
    expect(percentage(3, 3)).toBe(100);
  });

  it('is zero without answers', () => {
    expect(percentage(0, 0)).toBe(0);
  });
});

describe('describeAnswer', () => {
  const describe_ = (question: Question, value: ResponseAnswer['value'] | undefined) => describeAnswer(question, value, 'Other');

  it('shows nothing for no answer', () => {
    expect(describe_(text, undefined)).toBe('');
  });

  it('shows the label of a picked option, or the other text', () => {
    expect(describe_(choice, { optionId: 'b' })).toBe('Beta');
    expect(describe_(dropdown, { optionId: 'a' })).toBe('Alpha');
    expect(describe_(choice, { other: ' Gamma ' })).toBe('Other: Gamma');
    expect(describe_(choice, { other: ' ' })).toBe('');
    expect(describe_(choice, { optionId: 'unknown' })).toBe('');
  });

  it('lists ticked options and the other text', () => {
    expect(describe_(boxes, { optionIds: ['a', 'b'] })).toBe('Alpha, Beta');
    expect(describe_(boxes, { optionIds: ['b'], other: 'x' })).toBe('Beta, Other: x');
    expect(describe_(boxes, { optionIds: ['a'], other: ' ' })).toBe('Alpha');
  });

  it('shows numbers and text as they are', () => {
    expect(describe_(scale, 3)).toBe('3');
    expect(describe_(scale, 'x')).toBe('');
    expect(describe_(makeQuestion('r', { questionType: 'rating', settings: {} }), 4)).toBe('4');
    expect(describe_(text, 'hello')).toBe('hello');
    expect(describe_(makeQuestion('d', { questionType: 'date', settings: {} }), '2026-10-27')).toBe('2026-10-27');
    expect(describe_(makeQuestion('t', { questionType: 'time', settings: {} }), '10:30')).toBe('10:30');
  });

  it('lists uploaded files and describes grid answers by row', () => {
    expect(describe_(makeQuestion('f', { questionType: 'file_upload', settings: {} }), ['a.pdf', 'b.pdf'])).toBe('a.pdf, b.pdf');
    expect(describe_(makeQuestion('f', { questionType: 'file_upload', settings: {} }), 'x')).toBe('');
    const options = { rows: [{ id: 'r1', label: 'Food' }, { id: 'r2', label: 'Service' }], columns: [{ id: 'c1', label: 'Good' }, { id: 'c2', label: 'Bad' }] };
    const grid = makeQuestion('g', { questionType: 'multiple_choice_grid', options, settings: {} });
    expect(describe_(grid, { r1: 'c1', r2: 'c2' })).toBe('Food: Good; Service: Bad');
    expect(describe_(grid, { r1: 'c1' })).toBe('Food: Good');
    expect(describe_(makeQuestion('g', { questionType: 'checkbox_grid', options, settings: {} }), { r1: ['c1', 'c2'] })).toBe('Food: Good, Bad');
    expect(describe_(grid, 'x')).toBe('');
    expect(describe_(grid, ['x'])).toBe('');
  });
});
