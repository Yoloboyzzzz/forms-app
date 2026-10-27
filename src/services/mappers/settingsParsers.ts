import { RATING_ICONS } from '@/types/enums';
import type {
  CheckboxesSettings,
  ChoiceOption,
  DateSettings,
  DropdownSettings,
  FileUploadSettings,
  GridLine,
  GridOptions,
  GridSettings,
  LinearScaleSettings,
  RatingSettings,
  SingleChoiceSettings,
  TextSettings,
  TimeSettings,
  ValidationRule,
} from '@/types/models';
import {
  isRecord,
  readBoolean,
  readNumber,
  readOneOf,
  readString,
  readStringArray,
  type JsonRecord,
} from './json';

const NUMBER_OPERATORS = [
  'gt',
  'gte',
  'lt',
  'lte',
  'eq',
  'neq',
  'between',
  'notBetween',
  'isNumber',
  'isWholeNumber',
] as const;
const TEXT_OPERATORS = ['contains', 'notContains', 'isEmail', 'isUrl'] as const;
const LENGTH_OPERATORS = ['max', 'min'] as const;
const REGEX_OPERATORS = ['matches', 'notMatches', 'contains', 'notContains'] as const;
const COUNT_OPERATORS = ['atLeast', 'atMost', 'exactly'] as const;

/** Parses a validation rule; unknown or malformed rules are dropped instead of breaking the form. */
export function parseValidation(raw: unknown): ValidationRule | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  const errorMessage = readString(raw, 'errorMessage');
  const value = raw.value;

  switch (raw.kind) {
    case 'number': {
      const operator = readOneOf(raw, 'operator', NUMBER_OPERATORS);
      return operator === undefined
        ? undefined
        : { kind: 'number', operator, value: readNumber(raw, 'value'), valueMax: readNumber(raw, 'valueMax'), errorMessage };
    }
    case 'text': {
      const operator = readOneOf(raw, 'operator', TEXT_OPERATORS);
      return operator === undefined ? undefined : { kind: 'text', operator, value: readString(raw, 'value'), errorMessage };
    }
    case 'length': {
      const operator = readOneOf(raw, 'operator', LENGTH_OPERATORS);
      return operator === undefined || typeof value !== 'number'
        ? undefined
        : { kind: 'length', operator, value, errorMessage };
    }
    case 'regex': {
      const operator = readOneOf(raw, 'operator', REGEX_OPERATORS);
      return operator === undefined || typeof value !== 'string'
        ? undefined
        : { kind: 'regex', operator, value, errorMessage };
    }
    case 'checkboxCount': {
      const operator = readOneOf(raw, 'operator', COUNT_OPERATORS);
      return operator === undefined || typeof value !== 'number'
        ? undefined
        : { kind: 'checkboxCount', operator, value, errorMessage };
    }
    default:
      return undefined;
  }
}

export function parseTextSettings(raw: JsonRecord): TextSettings {
  return { validation: parseValidation(raw.validation) };
}

export function parseSingleChoiceSettings(raw: JsonRecord): SingleChoiceSettings {
  return {
    hasOtherOption: readBoolean(raw, 'hasOtherOption'),
    shuffleOptions: readBoolean(raw, 'shuffleOptions'),
    goToSectionBasedOnAnswer: readBoolean(raw, 'goToSectionBasedOnAnswer'),
  };
}

export function parseDropdownSettings(raw: JsonRecord): DropdownSettings {
  return {
    shuffleOptions: readBoolean(raw, 'shuffleOptions'),
    goToSectionBasedOnAnswer: readBoolean(raw, 'goToSectionBasedOnAnswer'),
  };
}

export function parseCheckboxesSettings(raw: JsonRecord): CheckboxesSettings {
  return {
    hasOtherOption: readBoolean(raw, 'hasOtherOption'),
    shuffleOptions: readBoolean(raw, 'shuffleOptions'),
    validation: parseValidation(raw.validation),
  };
}

export function parseLinearScaleSettings(raw: JsonRecord): LinearScaleSettings {
  return {
    min: readOneOf(raw, 'min', [0, 1] as const),
    max: readNumber(raw, 'max'),
    minLabel: readString(raw, 'minLabel'),
    maxLabel: readString(raw, 'maxLabel'),
  };
}

export function parseRatingSettings(raw: JsonRecord): RatingSettings {
  return { max: readNumber(raw, 'max'), icon: readOneOf(raw, 'icon', RATING_ICONS) };
}

export function parseGridSettings(raw: JsonRecord): GridSettings {
  return {
    requireEachRow: readBoolean(raw, 'requireEachRow'),
    limitOnePerColumn: readBoolean(raw, 'limitOnePerColumn'),
    shuffleRows: readBoolean(raw, 'shuffleRows'),
  };
}

export function parseDateSettings(raw: JsonRecord): DateSettings {
  return { includeYear: readBoolean(raw, 'includeYear'), includeTime: readBoolean(raw, 'includeTime') };
}

export function parseTimeSettings(raw: JsonRecord): TimeSettings {
  return { isDuration: readBoolean(raw, 'isDuration') };
}

export function parseFileUploadSettings(raw: JsonRecord): FileUploadSettings {
  return {
    allowedTypes: readStringArray(raw, 'allowedTypes'),
    maxFiles: readOneOf(raw, 'maxFiles', [1, 5, 10] as const),
    maxFileSizeMb: readNumber(raw, 'maxFileSizeMb'),
  };
}

/** Keeps only well-formed options; a null/missing goTo means "continue". */
export function parseChoiceOptions(raw: unknown): ChoiceOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((item: unknown): ChoiceOption[] => {
    if (!isRecord(item)) {
      return [];
    }
    const id = readString(item, 'id');
    const label = readString(item, 'label');
    if (id === undefined || label === undefined) {
      return [];
    }
    return [{ id, label, goTo: readString(item, 'goTo') }];
  });
}

function parseGridLines(raw: unknown): GridLine[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((item: unknown): GridLine[] => {
    if (!isRecord(item)) {
      return [];
    }
    const id = readString(item, 'id');
    const label = readString(item, 'label');
    return id === undefined || label === undefined ? [] : [{ id, label }];
  });
}

export function parseGridOptions(raw: unknown): GridOptions {
  if (!isRecord(raw)) {
    return { rows: [], columns: [] };
  }
  return { rows: parseGridLines(raw.rows), columns: parseGridLines(raw.columns) };
}
