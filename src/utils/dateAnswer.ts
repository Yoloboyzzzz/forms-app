export interface DateAnswerFormat {
  /** Ask for the year. Without it the answer is a day and month, stored in the current year. */
  includeYear: boolean;
  includeTime: boolean;
}

export type DateAnswerResult =
  | { status: 'empty' }
  | { status: 'ok'; value: string }
  | { status: 'invalid' };

/** The pattern shown as a hint, for example "YYYY-MM-DD HH:mm". */
export function datePlaceholder(format: DateAnswerFormat): string {
  return `${format.includeYear ? 'YYYY-MM-DD' : 'MM-DD'}${format.includeTime ? ' HH:mm' : ''}`;
}

const FULL = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/;
const SHORT = /^(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?$/;

function pad(value: number, length = 2): string {
  return value.toString().padStart(length, '0');
}

/**
 * Reads what the respondent typed and returns the value to store: "2026-10-27" or "2026-10-27T14:30".
 * Impossible dates (such as 2026-02-31) and a missing or unexpected time are invalid.
 */
export function parseDateAnswer(text: string, format: DateAnswerFormat, now: Date = new Date()): DateAnswerResult {
  const trimmed = text.trim();
  if (trimmed === '') return { status: 'empty' };

  const match = (format.includeYear ? FULL : SHORT).exec(trimmed);
  if (match === null) return { status: 'invalid' };

  const offset = format.includeYear ? 1 : 0;
  const year = format.includeYear ? Number(match[1]) : now.getFullYear();
  const month = Number(match[1 + offset]);
  const day = Number(match[2 + offset]);
  const hasTime = match[3 + offset] !== undefined;
  if (hasTime !== format.includeTime) return { status: 'invalid' };
  const hours = hasTime ? Number(match[3 + offset]) : 0;
  const minutes = hasTime ? Number(match[4 + offset]) : 0;

  const date = new Date(year, month - 1, day, hours, minutes);
  const isReal =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hours &&
    date.getMinutes() === minutes;
  if (!isReal) return { status: 'invalid' };

  const datePart = `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
  return { status: 'ok', value: hasTime ? `${datePart}T${pad(hours)}:${pad(minutes)}` : datePart };
}

/** The text to show in the input for a stored value, in the pattern of `datePlaceholder`. */
export function formatDateAnswer(value: string, format: DateAnswerFormat): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value);
  if (match === null) return value;
  const [, year, month, day, hours, minutes] = match;
  const datePart = format.includeYear ? `${year}-${month}-${day}` : `${month}-${day}`;
  return hours !== undefined && minutes !== undefined && format.includeTime ? `${datePart} ${hours}:${minutes}` : datePart;
}
