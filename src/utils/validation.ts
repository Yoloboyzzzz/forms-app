import type {
  CheckboxCountOperator,
  LengthOperator,
  NumberOperator,
  RegexOperator,
  TextOperator,
  ValidationRule,
} from '@/types/models';
import { assertNever } from './assertNever';

/** Why an answer failed a rule. The UI shows `customMessage` when the admin wrote one, else the translated default. */
export interface ValidationFailure {
  customMessage?: string;
  /** i18n key, `validation.rule.<kind>.<operator>`. */
  defaultKey: string;
  params: { value?: string; max?: string };
}

export type ValidationKind = ValidationRule['kind'];

export const VALIDATION_OPERATORS = {
  number: ['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'between', 'notBetween', 'isNumber', 'isWholeNumber'],
  text: ['contains', 'notContains', 'isEmail', 'isUrl'],
  length: ['max', 'min'],
  regex: ['matches', 'notMatches', 'contains', 'notContains'],
  checkboxCount: ['atLeast', 'atMost', 'exactly'],
} as const satisfies Record<ValidationKind, readonly string[]>;

/** Which kinds an admin can pick per question type. */
export const VALIDATION_KINDS_BY_QUESTION = {
  short_answer: ['number', 'text', 'length', 'regex'],
  paragraph: ['length', 'regex'],
  checkboxes: ['checkboxCount'],
} as const satisfies Record<string, readonly ValidationKind[]>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A fresh rule of the given kind with its first operator and no values yet. */
export function createRule(kind: ValidationKind): ValidationRule {
  switch (kind) {
    case 'number':
      return { kind, operator: 'gte' };
    case 'text':
      return { kind, operator: 'contains' };
    case 'length':
      return { kind, operator: 'max', value: 100 };
    case 'regex':
      return { kind, operator: 'matches', value: '' };
    case 'checkboxCount':
      return { kind, operator: 'atLeast', value: 1 };
    default:
      return assertNever(kind);
  }
}

/** The same rule with another operator; values the new operator cannot use are dropped. */
export function withOperator(rule: ValidationRule, operator: string): ValidationRule {
  switch (rule.kind) {
    case 'number': {
      const next = VALIDATION_OPERATORS.number.find((candidate) => candidate === operator);
      return next === undefined ? rule : { ...rule, operator: next };
    }
    case 'text': {
      const next = VALIDATION_OPERATORS.text.find((candidate) => candidate === operator);
      return next === undefined ? rule : { ...rule, operator: next };
    }
    case 'length': {
      const next = VALIDATION_OPERATORS.length.find((candidate) => candidate === operator);
      return next === undefined ? rule : { ...rule, operator: next };
    }
    case 'regex': {
      const next = VALIDATION_OPERATORS.regex.find((candidate) => candidate === operator);
      return next === undefined ? rule : { ...rule, operator: next };
    }
    case 'checkboxCount': {
      const next = VALIDATION_OPERATORS.checkboxCount.find((candidate) => candidate === operator);
      return next === undefined ? rule : { ...rule, operator: next };
    }
    default:
      return assertNever(rule);
  }
}

function parseNumber(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** The rule's main value as text, for an input field. */
export function valueText(rule: ValidationRule): string {
  return rule.value === undefined ? '' : String(rule.value);
}

/** The upper bound of "between" as text. */
export function maxText(rule: ValidationRule): string {
  return rule.kind === 'number' && rule.valueMax !== undefined ? String(rule.valueMax) : '';
}

/**
 * The rule with the value typed into the field. Numeric kinds that need a value keep the old one
 * while the field holds something that is not a number.
 */
export function withValue(rule: ValidationRule, text: string): ValidationRule {
  switch (rule.kind) {
    case 'number':
      return { ...rule, value: parseNumber(text) };
    case 'text':
      return { ...rule, value: text === '' ? undefined : text };
    case 'length':
    case 'checkboxCount': {
      const value = parseNumber(text);
      return value === undefined ? rule : { ...rule, value };
    }
    case 'regex':
      return { ...rule, value: text };
    default:
      return assertNever(rule);
  }
}

/** The rule with the upper bound typed into the field (only "between" rules have one). */
export function withMax(rule: ValidationRule, text: string): ValidationRule {
  return rule.kind === 'number' ? { ...rule, valueMax: parseNumber(text) } : rule;
}

/** The rule with a custom error message; an empty text removes it. */
export function withErrorMessage(rule: ValidationRule, text: string): ValidationRule {
  return { ...rule, errorMessage: text === '' ? undefined : text };
}

/** Whether the rule needs a value, and a second value (the upper bound of "between"). */
export function ruleInputs(rule: ValidationRule): { value: boolean; max: boolean } {
  switch (rule.kind) {
    case 'number':
      return {
        value: rule.operator !== 'isNumber' && rule.operator !== 'isWholeNumber',
        max: rule.operator === 'between' || rule.operator === 'notBetween',
      };
    case 'text':
      return { value: rule.operator === 'contains' || rule.operator === 'notContains', max: false };
    case 'length':
    case 'regex':
    case 'checkboxCount':
      return { value: true, max: false };
    default:
      return assertNever(rule);
  }
}

function failure(rule: ValidationRule, params: ValidationFailure['params'] = {}): ValidationFailure {
  return { customMessage: rule.errorMessage, defaultKey: `validation.rule.${rule.kind}.${rule.operator}`, params };
}

function checkNumber(rule: Extract<ValidationRule, { kind: 'number' }>, answer: string): ValidationFailure | undefined {
  const params = { value: rule.value?.toString(), max: rule.valueMax?.toString() };
  const n = parseNumber(answer);
  if (n === undefined) {
    return { customMessage: rule.errorMessage, defaultKey: 'validation.rule.number.notANumber', params };
  }
  const { value, valueMax } = rule;
  const passes = (() => {
    switch (rule.operator) {
      case 'isNumber':
        return true;
      case 'isWholeNumber':
        return Number.isInteger(n);
      case 'gt':
        return value === undefined || n > value;
      case 'gte':
        return value === undefined || n >= value;
      case 'lt':
        return value === undefined || n < value;
      case 'lte':
        return value === undefined || n <= value;
      case 'eq':
        return value === undefined || n === value;
      case 'neq':
        return value === undefined || n !== value;
      case 'between':
        return value === undefined || valueMax === undefined || (n >= value && n <= valueMax);
      case 'notBetween':
        return value === undefined || valueMax === undefined || n < value || n > valueMax;
      default:
        return assertNever(rule.operator);
    }
  })();
  return passes ? undefined : failure(rule, params);
}

function checkRegex(rule: Extract<ValidationRule, { kind: 'regex' }>, answer: string): ValidationFailure | undefined {
  let pattern: RegExp;
  let whole: RegExp;
  try {
    pattern = new RegExp(rule.value);
    whole = new RegExp(`^(?:${rule.value})$`);
  } catch {
    return undefined; // an invalid pattern is the admin's mistake; it must not block respondents
  }
  const found = pattern.test(answer);
  const passes = {
    matches: whole.test(answer),
    notMatches: !whole.test(answer),
    contains: found,
    notContains: !found,
  }[rule.operator];
  return passes ? undefined : failure(rule, { value: rule.value });
}

function isUrl(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Checks a text answer against a rule. Empty answers pass: "required" is a separate setting.
 * Rules of kind `checkboxCount` apply to `validateSelectionCount` instead and always pass here.
 */
export function validateText(rule: ValidationRule, answer: string): ValidationFailure | undefined {
  if (answer.trim() === '') return undefined;
  switch (rule.kind) {
    case 'number':
      return checkNumber(rule, answer);
    case 'text': {
      const passes = {
        contains: rule.value === undefined || answer.includes(rule.value),
        notContains: rule.value === undefined || !answer.includes(rule.value),
        isEmail: EMAIL_PATTERN.test(answer.trim()),
        isUrl: isUrl(answer),
      }[rule.operator];
      return passes ? undefined : failure(rule, { value: rule.value });
    }
    case 'length': {
      const passes = rule.operator === 'max' ? answer.length <= rule.value : answer.length >= rule.value;
      return passes ? undefined : failure(rule, { value: rule.value.toString() });
    }
    case 'regex':
      return checkRegex(rule, answer);
    case 'checkboxCount':
      return undefined;
    default:
      return assertNever(rule);
  }
}

/** Checks how many checkboxes are ticked. Only rules of kind `checkboxCount` apply; nothing ticked passes. */
export function validateSelectionCount(rule: ValidationRule, count: number): ValidationFailure | undefined {
  if (rule.kind !== 'checkboxCount' || count === 0) return undefined;
  const operator: CheckboxCountOperator = rule.operator;
  const passes = {
    atLeast: count >= rule.value,
    atMost: count <= rule.value,
    exactly: count === rule.value,
  }[operator];
  return passes ? undefined : failure(rule, { value: rule.value.toString() });
}

// The operator types are re-exported so editors can type their Select options without importing models.
export type { CheckboxCountOperator, LengthOperator, NumberOperator, RegexOperator, TextOperator };
