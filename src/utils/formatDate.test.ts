import { formatDate, formatDateTime } from './formatDate';

const date = new Date(2026, 9, 27, 14, 30);

describe('formatDate', () => {
  it('uses the locale of the active language', () => {
    expect(formatDate(date, 'en')).toBe('Oct 27, 2026');
    expect(formatDate(date, 'nl')).toBe('27 okt 2026');
  });
});

describe('formatDateTime', () => {
  it('includes the time', () => {
    expect(formatDateTime(date, 'nl')).toContain('14:30');
    expect(formatDateTime(date, 'en')).toMatch(/2:30\s?PM/);
  });
});
