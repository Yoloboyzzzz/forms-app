import {
  parseCheckboxesSettings,
  parseChoiceOptions,
  parseDateSettings,
  parseDropdownSettings,
  parseFileUploadSettings,
  parseGridOptions,
  parseGridSettings,
  parseLinearScaleSettings,
  parseRatingSettings,
  parseSingleChoiceSettings,
  parseTextSettings,
  parseTimeSettings,
  parseValidation,
} from './settingsParsers';

describe('parseValidation', () => {
  it.each([
    [{ kind: 'number', operator: 'between', value: 1, valueMax: 5, errorMessage: 'no' }],
    [{ kind: 'text', operator: 'contains', value: 'abc' }],
    [{ kind: 'length', operator: 'max', value: 10 }],
    [{ kind: 'regex', operator: 'matches', value: '^a' }],
    [{ kind: 'checkboxCount', operator: 'atLeast', value: 2 }],
  ])('accepts a valid rule %j', (raw) => {
    expect(parseValidation(raw)).toMatchObject(raw);
  });

  it.each([
    ['not an object', 'x'],
    ['unknown kind', { kind: 'other', operator: 'x' }],
    ['bad number operator', { kind: 'number', operator: 'huge' }],
    ['bad text operator', { kind: 'text', operator: 'huge' }],
    ['length without value', { kind: 'length', operator: 'max' }],
    ['length bad operator', { kind: 'length', operator: 'huge', value: 1 }],
    ['regex without value', { kind: 'regex', operator: 'matches' }],
    ['regex bad operator', { kind: 'regex', operator: 'huge', value: 'a' }],
    ['count without value', { kind: 'checkboxCount', operator: 'atLeast' }],
    ['count bad operator', { kind: 'checkboxCount', operator: 'huge', value: 1 }],
  ])('drops an invalid rule: %s', (_name, raw) => {
    expect(parseValidation(raw)).toBeUndefined();
  });
});

describe('settings parsers', () => {
  it('parses text settings', () => {
    expect(parseTextSettings({ validation: { kind: 'text', operator: 'isEmail' } }).validation?.kind).toBe('text');
    expect(parseTextSettings({}).validation).toBeUndefined();
  });

  it('parses choice settings', () => {
    const raw = { hasOtherOption: true, shuffleOptions: false, goToSectionBasedOnAnswer: true };
    expect(parseSingleChoiceSettings(raw)).toEqual(raw);
    expect(parseDropdownSettings(raw)).toEqual({ shuffleOptions: false, goToSectionBasedOnAnswer: true });
    expect(parseCheckboxesSettings({ hasOtherOption: true }).hasOtherOption).toBe(true);
  });

  it('parses linear scale and ignores out-of-range min', () => {
    expect(parseLinearScaleSettings({ min: 1, max: 5, minLabel: 'a', maxLabel: 'b' })).toEqual({
      min: 1,
      max: 5,
      minLabel: 'a',
      maxLabel: 'b',
    });
    expect(parseLinearScaleSettings({ min: 7 }).min).toBeUndefined();
  });

  it('parses rating, grid, date, time and upload settings', () => {
    expect(parseRatingSettings({ max: 5, icon: 'heart' })).toEqual({ max: 5, icon: 'heart' });
    expect(parseRatingSettings({ icon: 'cat' }).icon).toBeUndefined();
    expect(parseGridSettings({ requireEachRow: true }).requireEachRow).toBe(true);
    expect(parseDateSettings({ includeYear: true, includeTime: false })).toEqual({
      includeYear: true,
      includeTime: false,
    });
    expect(parseTimeSettings({ isDuration: true }).isDuration).toBe(true);
    expect(parseFileUploadSettings({ allowedTypes: ['pdf'], maxFiles: 5, maxFileSizeMb: 10 })).toEqual({
      allowedTypes: ['pdf'],
      maxFiles: 5,
      maxFileSizeMb: 10,
    });
    expect(parseFileUploadSettings({ maxFiles: 3 }).maxFiles).toBeUndefined();
  });
});

describe('parseChoiceOptions', () => {
  it('keeps valid options and maps null goTo to undefined', () => {
    expect(
      parseChoiceOptions([
        { id: 'a', label: 'A', goTo: null },
        { id: 'b', label: 'B', goTo: 'submit' },
      ]),
    ).toEqual([
      { id: 'a', label: 'A', goTo: undefined },
      { id: 'b', label: 'B', goTo: 'submit' },
    ]);
  });

  it('drops malformed entries and non-arrays', () => {
    expect(parseChoiceOptions([{ id: 'a' }, 'x', null, { label: 'x' }])).toEqual([]);
    expect(parseChoiceOptions(null)).toEqual([]);
    expect(parseChoiceOptions({})).toEqual([]);
  });
});

describe('parseGridOptions', () => {
  it('parses rows and columns', () => {
    expect(
      parseGridOptions({ rows: [{ id: 'r1', label: 'R' }], columns: [{ id: 'c1', label: 'C' }] }),
    ).toEqual({ rows: [{ id: 'r1', label: 'R' }], columns: [{ id: 'c1', label: 'C' }] });
  });

  it('survives invalid input', () => {
    expect(parseGridOptions('x')).toEqual({ rows: [], columns: [] });
    expect(parseGridOptions({ rows: [{ id: 1 }, 5], columns: 'x' })).toEqual({ rows: [], columns: [] });
  });
});
