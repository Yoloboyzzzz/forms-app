import {
  fromNullable,
  isRecord,
  readBoolean,
  readNumber,
  readOneOf,
  readString,
  readStringArray,
  toDate,
  toJson,
  toOptionalDate,
} from './json';

describe('isRecord', () => {
  it('accepts plain objects only', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('x')).toBe(false);
  });
});

describe('readers', () => {
  const record = { s: 'a', n: 2, b: true, arr: ['x', 'y'], bad: [1], inf: Infinity };

  it('reads values of the right type', () => {
    expect(readString(record, 's')).toBe('a');
    expect(readNumber(record, 'n')).toBe(2);
    expect(readBoolean(record, 'b')).toBe(true);
    expect(readStringArray(record, 'arr')).toEqual(['x', 'y']);
  });

  it('returns undefined for wrong types or missing keys', () => {
    expect(readString(record, 'n')).toBeUndefined();
    expect(readNumber(record, 's')).toBeUndefined();
    expect(readNumber(record, 'inf')).toBeUndefined();
    expect(readBoolean(record, 's')).toBeUndefined();
    expect(readStringArray(record, 'bad')).toBeUndefined();
    expect(readStringArray(record, 's')).toBeUndefined();
    expect(readString(record, 'missing')).toBeUndefined();
  });

  it('reads one of an allowed list', () => {
    expect(readOneOf({ k: 'a' }, 'k', ['a', 'b'] as const)).toBe('a');
    expect(readOneOf({ k: 'c' }, 'k', ['a', 'b'] as const)).toBeUndefined();
    expect(readOneOf({ k: 5 }, 'k', [1, 5] as const)).toBe(5);
  });
});

describe('null and date helpers', () => {
  it('converts null to undefined', () => {
    expect(fromNullable(null)).toBeUndefined();
    expect(fromNullable('x')).toBe('x');
  });

  it('parses dates', () => {
    expect(toDate('2026-10-27T10:00:00Z').toISOString()).toBe('2026-10-27T10:00:00.000Z');
    expect(toOptionalDate(null)).toBeUndefined();
    expect(toOptionalDate('2026-10-27T10:00:00Z')).toBeInstanceOf(Date);
  });
});

describe('toJson', () => {
  it('drops undefined fields', () => {
    expect(toJson({ a: 1, b: undefined })).toEqual({ a: 1 });
  });
});
