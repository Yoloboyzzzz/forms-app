/** Formats a date in the given locale (the active UI language), for example "27 Oct 2026". */
export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

/** Formats a date with its time, for example "27 Oct 2026, 14:30". */
export function formatDateTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
