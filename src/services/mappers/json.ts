import type { Json } from '@/types/supabase';

export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

export function readNumber(record: JsonRecord, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function readBoolean(record: JsonRecord, key: string): boolean | undefined {
  const value = record[key];
  return typeof value === 'boolean' ? value : undefined;
}

export function readStringArray(record: JsonRecord, key: string): string[] | undefined {
  const value = record[key];
  if (!Array.isArray(value) || !value.every((item): item is string => typeof item === 'string')) {
    return undefined;
  }
  return value;
}

/** Returns the matching member of `allowed`, or undefined; avoids casting to the union. */
export function readOneOf<T extends string | number>(
  record: JsonRecord,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = record[key];
  return allowed.find((candidate) => candidate === value);
}

/** Database nullable → domain optional (domain models avoid null, AGENTS.md D16). */
export function fromNullable<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

export function toDate(value: string): Date {
  return new Date(value);
}

export function toOptionalDate(value: string | null): Date | undefined {
  return value === null ? undefined : new Date(value);
}

/**
 * Serialises a typed domain value for a jsonb column and drops `undefined` fields.
 * JSON.parse is typed `any` in the standard library, which is assignable to Json without a cast.
 */
export function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value));
}
