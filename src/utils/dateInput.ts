const PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/;

export type DateInputResult =
  | { status: 'empty' }
  | { status: 'ok'; date: Date }
  | { status: 'invalid' };

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** A date as "YYYY-MM-DD HH:mm" in the device's time zone, for a text field. */
export function formatDateTimeInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Reads "YYYY-MM-DD" or "YYYY-MM-DD HH:mm" (local time). A date without a time means the end of that day,
 * so "closes on 2026-11-04" keeps the whole day open. Impossible dates such as 2026-02-31 are invalid.
 */
export function parseDateTimeInput(text: string): DateInputResult {
  const trimmed = text.trim();
  if (trimmed === '') return { status: 'empty' };

  const match = PATTERN.exec(trimmed);
  if (match === null) return { status: 'invalid' };

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const hasTime = match[4] !== undefined && match[5] !== undefined;
  const hours = hasTime ? Number(match[4]) : 23;
  const minutes = hasTime ? Number(match[5]) : 59;

  const date = new Date(year, month - 1, day, hours, minutes);
  const isReal =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hours &&
    date.getMinutes() === minutes;
  return isReal ? { status: 'ok', date } : { status: 'invalid' };
}
