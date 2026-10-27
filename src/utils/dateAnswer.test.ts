import { datePlaceholder, formatDateAnswer, parseDateAnswer, type DateAnswerFormat } from './dateAnswer';

const dateOnly: DateAnswerFormat = { includeYear: true, includeTime: false };
const dateTime: DateAnswerFormat = { includeYear: true, includeTime: true };
const dayMonth: DateAnswerFormat = { includeYear: false, includeTime: false };
const dayMonthTime: DateAnswerFormat = { includeYear: false, includeTime: true };
const now = new Date(2026, 5, 15);

describe('datePlaceholder', () => {
  it('shows the expected pattern', () => {
    expect(datePlaceholder(dateOnly)).toBe('YYYY-MM-DD');
    expect(datePlaceholder(dateTime)).toBe('YYYY-MM-DD HH:mm');
    expect(datePlaceholder(dayMonth)).toBe('MM-DD');
    expect(datePlaceholder(dayMonthTime)).toBe('MM-DD HH:mm');
  });
});

describe('parseDateAnswer', () => {
  it('reads a date', () => {
    expect(parseDateAnswer('2026-10-27', dateOnly)).toEqual({ status: 'ok', value: '2026-10-27' });
    expect(parseDateAnswer(' 2026-10-27 ', dateOnly)).toEqual({ status: 'ok', value: '2026-10-27' });
  });

  it('reads a date with time, with a space or a T', () => {
    expect(parseDateAnswer('2026-10-27 14:30', dateTime)).toEqual({ status: 'ok', value: '2026-10-27T14:30' });
    expect(parseDateAnswer('2026-10-27T09:05', dateTime)).toEqual({ status: 'ok', value: '2026-10-27T09:05' });
  });

  it('reads a day and month in the current year', () => {
    expect(parseDateAnswer('10-27', dayMonth, now)).toEqual({ status: 'ok', value: '2026-10-27' });
    expect(parseDateAnswer('10-27 08:00', dayMonthTime, now)).toEqual({ status: 'ok', value: '2026-10-27T08:00' });
  });

  it('uses the current year by default', () => {
    expect(parseDateAnswer('01-02', dayMonth)).toMatchObject({ status: 'ok', value: expect.stringMatching(/^\d{4}-01-02$/) });
  });

  it('treats blank text as empty', () => {
    expect(parseDateAnswer('  ', dateOnly)).toEqual({ status: 'empty' });
  });

  it.each([
    ['text', dateOnly],
    ['27-10-2026', dateOnly],
    ['2026-02-31', dateOnly],
    ['2026-13-01', dateOnly],
    ['2026-10-27 25:00', dateTime],
    ['2026-10-27', dateTime],
    ['2026-10-27 10:00', dateOnly],
    ['02-31', dayMonth],
    ['10-27', dayMonthTime],
  ] as const)('rejects %s', (text, format) => {
    expect(parseDateAnswer(text, format, now)).toEqual({ status: 'invalid' });
  });
});

describe('formatDateAnswer', () => {
  it('shows a stored value in the input pattern', () => {
    expect(formatDateAnswer('2026-10-27', dateOnly)).toBe('2026-10-27');
    expect(formatDateAnswer('2026-10-27T14:30', dateTime)).toBe('2026-10-27 14:30');
    expect(formatDateAnswer('2026-10-27', dayMonth)).toBe('10-27');
    expect(formatDateAnswer('2026-10-27T14:30', dayMonthTime)).toBe('10-27 14:30');
  });

  it('drops a stored time when the question no longer asks for it', () => {
    expect(formatDateAnswer('2026-10-27T14:30', dateOnly)).toBe('2026-10-27');
  });

  it('shows unknown text as it is', () => {
    expect(formatDateAnswer('whenever', dateOnly)).toBe('whenever');
  });

  it('round-trips with the parser', () => {
    const parsed = parseDateAnswer('2026-10-27 14:30', dateTime);
    expect(parsed.status === 'ok' && formatDateAnswer(parsed.value, dateTime)).toBe('2026-10-27 14:30');
  });
});
