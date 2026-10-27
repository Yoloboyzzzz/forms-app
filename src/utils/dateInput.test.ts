import { formatDateTimeInput, parseDateTimeInput } from './dateInput';

describe('formatDateTimeInput', () => {
  it('writes a local date and time with leading zeros', () => {
    expect(formatDateTimeInput(new Date(2026, 0, 5, 9, 7))).toBe('2026-01-05 09:07');
  });
});

describe('parseDateTimeInput', () => {
  it('reads a date with a time', () => {
    expect(parseDateTimeInput('2026-11-04 14:30')).toEqual({ status: 'ok', date: new Date(2026, 10, 4, 14, 30) });
    expect(parseDateTimeInput('2026-11-04T14:30')).toEqual({ status: 'ok', date: new Date(2026, 10, 4, 14, 30) });
  });

  it('reads a date alone as the end of that day', () => {
    expect(parseDateTimeInput(' 2026-11-04 ')).toEqual({ status: 'ok', date: new Date(2026, 10, 4, 23, 59) });
  });

  it('round-trips through the formatter', () => {
    const date = new Date(2026, 5, 15, 8, 5);
    expect(parseDateTimeInput(formatDateTimeInput(date))).toEqual({ status: 'ok', date });
  });

  it('treats blank text as empty', () => {
    expect(parseDateTimeInput('')).toEqual({ status: 'empty' });
    expect(parseDateTimeInput('   ')).toEqual({ status: 'empty' });
  });

  it.each(['04-11-2026', '2026-11', 'tomorrow', '2026-13-01', '2026-02-31', '2026-11-04 25:00', '2026-11-04 10:75'])(
    'rejects %s',
    (text) => {
      expect(parseDateTimeInput(text)).toEqual({ status: 'invalid' });
    },
  );
});
