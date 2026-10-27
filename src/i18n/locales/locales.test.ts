import en from './en.json';
import nl from './nl.json';

type Json = { [key: string]: string | Json };

function flatten(obj: Json, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : flatten(value, `${prefix}${key}.`),
  );
}

describe('locale files', () => {
  const nlKeys = flatten(nl).sort();
  const enKeys = flatten(en).sort();

  it('has every nl key in en', () => {
    expect(nlKeys.filter((key) => !enKeys.includes(key))).toEqual([]);
  });

  it('has every en key in nl', () => {
    expect(enKeys.filter((key) => !nlKeys.includes(key))).toEqual([]);
  });
});
