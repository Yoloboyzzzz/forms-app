export type TimeAnswerResult =
  | { status: 'empty' }
  | { status: 'ok'; value: string }
  | { status: 'invalid' };

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** The pattern shown as a hint: "HH:mm" for a time of day, "HH:mm:ss" for a duration. */
export function timePlaceholder(isDuration: boolean): string {
  return isDuration ? 'HH:mm:ss' : 'HH:mm';
}

/**
 * Reads a typed time. A time of day is "HH:mm" (00:00 to 23:59); a duration is "HH:mm:ss" with any number of
 * hours up to 999. The stored value uses two digits for minutes and seconds ("01:15:00").
 */
export function parseTimeAnswer(text: string, isDuration: boolean): TimeAnswerResult {
  const trimmed = text.trim();
  if (trimmed === '') return { status: 'empty' };

  if (isDuration) {
    const match = /^(\d{1,3}):(\d{2}):(\d{2})$/.exec(trimmed);
    if (match === null) return { status: 'invalid' };
    const [hours, minutes, seconds] = [Number(match[1]), Number(match[2]), Number(match[3])];
    return minutes < 60 && seconds < 60
      ? { status: 'ok', value: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` }
      : { status: 'invalid' };
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (match === null) return { status: 'invalid' };
  const [hours, minutes] = [Number(match[1]), Number(match[2])];
  return hours < 24 && minutes < 60 ? { status: 'ok', value: `${pad(hours)}:${pad(minutes)}` } : { status: 'invalid' };
}
