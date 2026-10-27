/**
 * Returns the value of an environment variable or throws a clear error when it is missing.
 * Lives apart from env.ts because Expo inlines EXPO_PUBLIC_* values at build time, which makes env.ts itself untestable.
 */
export function required(name: string, value: string | undefined): string {
  if (value === undefined || value === '') {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}
