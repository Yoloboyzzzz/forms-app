import type { ValidationRule } from '@/types/models';
import {
  createRule,
  ruleInputs,
  validateSelectionCount,
  validateText,
  VALIDATION_OPERATORS,
  withOperator,
} from './validation';

const keyOf = (rule: ValidationRule, answer: string) => validateText(rule, answer)?.defaultKey;

describe('validateText: number', () => {
  const rule = (operator: Extract<ValidationRule, { kind: 'number' }>['operator'], value?: number, valueMax?: number): ValidationRule => ({
    kind: 'number',
    operator,
    value,
    valueMax,
  });

  it.each([
    ['gt', 5, '6', '5'],
    ['gte', 5, '5', '4'],
    ['lt', 5, '4', '5'],
    ['lte', 5, '5', '6'],
    ['eq', 5, '5', '6'],
    ['neq', 5, '6', '5'],
  ] as const)('%s %d accepts %s and rejects %s', (operator, value, good, bad) => {
    expect(validateText(rule(operator, value), good)).toBeUndefined();
    expect(keyOf(rule(operator, value), bad)).toBe(`validation.rule.number.${operator}`);
  });

  it('checks between inclusive of both bounds', () => {
    const between = rule('between', 1, 10);
    expect(validateText(between, '1')).toBeUndefined();
    expect(validateText(between, '10')).toBeUndefined();
    expect(keyOf(between, '11')).toBe('validation.rule.number.between');
    expect(keyOf(between, '0')).toBe('validation.rule.number.between');
  });

  it('checks not between', () => {
    const notBetween = rule('notBetween', 1, 10);
    expect(validateText(notBetween, '11')).toBeUndefined();
    expect(keyOf(notBetween, '5')).toBe('validation.rule.number.notBetween');
  });

  it('accepts only whole numbers when asked', () => {
    expect(validateText(rule('isWholeNumber'), '4')).toBeUndefined();
    expect(keyOf(rule('isWholeNumber'), '4.5')).toBe('validation.rule.number.isWholeNumber');
  });

  it('accepts any number for isNumber, with a decimal comma', () => {
    expect(validateText(rule('isNumber'), '3,5')).toBeUndefined();
    expect(validateText(rule('isNumber'), ' -2.5 ')).toBeUndefined();
  });

  it.each(['abc', '1e', 'NaN', 'Infinity'])('rejects the non-number %s with the generic message', (answer) => {
    expect(keyOf(rule('gte', 1), answer)).toBe('validation.rule.number.notANumber');
  });

  it('puts the values in the failure so the message can show them', () => {
    expect(validateText(rule('between', 1, 10), '50')?.params).toEqual({ value: '1', max: '10' });
  });

  it('does not block when the rule has no value yet', () => {
    expect(validateText(rule('gt'), '1')).toBeUndefined();
    expect(validateText(rule('gte'), '1')).toBeUndefined();
    expect(validateText(rule('lt'), '1')).toBeUndefined();
    expect(validateText(rule('lte'), '1')).toBeUndefined();
    expect(validateText(rule('eq'), '1')).toBeUndefined();
    expect(validateText(rule('neq'), '1')).toBeUndefined();
    expect(validateText(rule('between', 1), '5')).toBeUndefined();
    expect(validateText(rule('notBetween', 1), '5')).toBeUndefined();
    expect(validateText(rule('between'), '5')).toBeUndefined();
    expect(validateText(rule('notBetween'), '5')).toBeUndefined();
  });
});

describe('validateText: text', () => {
  it('checks contains and not contains', () => {
    expect(validateText({ kind: 'text', operator: 'contains', value: 'abc' }, 'xabcx')).toBeUndefined();
    expect(keyOf({ kind: 'text', operator: 'contains', value: 'abc' }, 'xyz')).toBe('validation.rule.text.contains');
    expect(validateText({ kind: 'text', operator: 'notContains', value: 'abc' }, 'xyz')).toBeUndefined();
    expect(keyOf({ kind: 'text', operator: 'notContains', value: 'abc' }, 'xabcx')).toBe('validation.rule.text.notContains');
  });

  it('does not block when contains has no value yet', () => {
    expect(validateText({ kind: 'text', operator: 'contains' }, 'x')).toBeUndefined();
    expect(validateText({ kind: 'text', operator: 'notContains' }, 'x')).toBeUndefined();
  });

  it('checks email addresses', () => {
    expect(validateText({ kind: 'text', operator: 'isEmail' }, ' a@b.co ')).toBeUndefined();
    expect(keyOf({ kind: 'text', operator: 'isEmail' }, 'nope')).toBe('validation.rule.text.isEmail');
  });

  it('checks web addresses', () => {
    expect(validateText({ kind: 'text', operator: 'isUrl' }, 'https://example.com/a')).toBeUndefined();
    expect(keyOf({ kind: 'text', operator: 'isUrl' }, 'example.com')).toBe('validation.rule.text.isUrl');
    expect(keyOf({ kind: 'text', operator: 'isUrl' }, 'ftp://example.com')).toBe('validation.rule.text.isUrl');
  });
});

describe('validateText: length', () => {
  it('checks the maximum and minimum', () => {
    expect(validateText({ kind: 'length', operator: 'max', value: 3 }, 'abc')).toBeUndefined();
    expect(keyOf({ kind: 'length', operator: 'max', value: 3 }, 'abcd')).toBe('validation.rule.length.max');
    expect(validateText({ kind: 'length', operator: 'min', value: 3 }, 'abc')).toBeUndefined();
    expect(keyOf({ kind: 'length', operator: 'min', value: 3 }, 'ab')).toBe('validation.rule.length.min');
  });
});

describe('validateText: regex', () => {
  it('matches the whole answer', () => {
    const rule: ValidationRule = { kind: 'regex', operator: 'matches', value: '[0-9]{3}' };
    expect(validateText(rule, '123')).toBeUndefined();
    expect(keyOf(rule, '1234')).toBe('validation.rule.regex.matches');
  });

  it('rejects a full match for not matches', () => {
    const rule: ValidationRule = { kind: 'regex', operator: 'notMatches', value: '[0-9]+' };
    expect(validateText(rule, 'abc')).toBeUndefined();
    expect(keyOf(rule, '123')).toBe('validation.rule.regex.notMatches');
  });

  it('finds the pattern anywhere for contains and not contains', () => {
    expect(validateText({ kind: 'regex', operator: 'contains', value: '[0-9]' }, 'ab1')).toBeUndefined();
    expect(keyOf({ kind: 'regex', operator: 'contains', value: '[0-9]' }, 'abc')).toBe('validation.rule.regex.contains');
    expect(validateText({ kind: 'regex', operator: 'notContains', value: '[0-9]' }, 'abc')).toBeUndefined();
    expect(keyOf({ kind: 'regex', operator: 'notContains', value: '[0-9]' }, 'ab1')).toBe('validation.rule.regex.notContains');
  });

  it('never blocks on an invalid pattern', () => {
    expect(validateText({ kind: 'regex', operator: 'matches', value: '(' }, 'anything')).toBeUndefined();
  });
});

describe('validateText: general', () => {
  it('lets empty answers pass (required is a separate setting)', () => {
    expect(validateText({ kind: 'length', operator: 'min', value: 5 }, '')).toBeUndefined();
    expect(validateText({ kind: 'number', operator: 'gt', value: 5 }, '   ')).toBeUndefined();
  });

  it('prefers the custom message the admin wrote', () => {
    const rule: ValidationRule = { kind: 'length', operator: 'max', value: 2, errorMessage: 'Too long!' };
    expect(validateText(rule, 'abc')).toMatchObject({ customMessage: 'Too long!', defaultKey: 'validation.rule.length.max' });
  });

  it('ignores checkbox count rules', () => {
    expect(validateText({ kind: 'checkboxCount', operator: 'atLeast', value: 2 }, 'x')).toBeUndefined();
  });
});

describe('validateSelectionCount', () => {
  it('checks at least, at most and exactly', () => {
    expect(validateSelectionCount({ kind: 'checkboxCount', operator: 'atLeast', value: 2 }, 2)).toBeUndefined();
    expect(validateSelectionCount({ kind: 'checkboxCount', operator: 'atLeast', value: 2 }, 1)?.defaultKey).toBe(
      'validation.rule.checkboxCount.atLeast',
    );
    expect(validateSelectionCount({ kind: 'checkboxCount', operator: 'atMost', value: 2 }, 2)).toBeUndefined();
    expect(validateSelectionCount({ kind: 'checkboxCount', operator: 'atMost', value: 2 }, 3)?.params).toEqual({ value: '2' });
    expect(validateSelectionCount({ kind: 'checkboxCount', operator: 'exactly', value: 2 }, 2)).toBeUndefined();
    expect(validateSelectionCount({ kind: 'checkboxCount', operator: 'exactly', value: 2 }, 3)).toBeDefined();
  });

  it('passes when nothing is ticked (required is separate) and for other kinds of rules', () => {
    expect(validateSelectionCount({ kind: 'checkboxCount', operator: 'atLeast', value: 2 }, 0)).toBeUndefined();
    expect(validateSelectionCount({ kind: 'length', operator: 'max', value: 1 }, 5)).toBeUndefined();
  });
});

describe('createRule', () => {
  it.each(['number', 'text', 'length', 'regex', 'checkboxCount'] as const)('creates a valid %s rule', (kind) => {
    const rule = createRule(kind);
    expect(rule.kind).toBe(kind);
    expect(VALIDATION_OPERATORS[kind]).toContain(rule.operator);
  });
});

describe('withOperator', () => {
  it.each([
    ['number', 'between'],
    ['text', 'isEmail'],
    ['length', 'min'],
    ['regex', 'notMatches'],
    ['checkboxCount', 'exactly'],
  ] as const)('switches a %s rule to %s', (kind, operator) => {
    expect(withOperator(createRule(kind), operator)).toMatchObject({ kind, operator });
  });

  it.each(['number', 'text', 'length', 'regex', 'checkboxCount'] as const)('keeps a %s rule for an unknown operator', (kind) => {
    const rule = createRule(kind);
    expect(withOperator(rule, 'bogus')).toBe(rule);
  });

  it('keeps the values of the rule', () => {
    expect(withOperator({ kind: 'number', operator: 'gt', value: 3 }, 'lt')).toEqual({ kind: 'number', operator: 'lt', value: 3 });
  });
});

describe('ruleInputs', () => {
  it('tells which inputs an operator needs', () => {
    expect(ruleInputs({ kind: 'number', operator: 'gt' })).toEqual({ value: true, max: false });
    expect(ruleInputs({ kind: 'number', operator: 'between' })).toEqual({ value: true, max: true });
    expect(ruleInputs({ kind: 'number', operator: 'notBetween' })).toEqual({ value: true, max: true });
    expect(ruleInputs({ kind: 'number', operator: 'isNumber' })).toEqual({ value: false, max: false });
    expect(ruleInputs({ kind: 'number', operator: 'isWholeNumber' })).toEqual({ value: false, max: false });
    expect(ruleInputs({ kind: 'text', operator: 'contains' })).toEqual({ value: true, max: false });
    expect(ruleInputs({ kind: 'text', operator: 'notContains' })).toEqual({ value: true, max: false });
    expect(ruleInputs({ kind: 'text', operator: 'isEmail' })).toEqual({ value: false, max: false });
    expect(ruleInputs({ kind: 'text', operator: 'isUrl' })).toEqual({ value: false, max: false });
    expect(ruleInputs({ kind: 'length', operator: 'max', value: 1 })).toEqual({ value: true, max: false });
    expect(ruleInputs({ kind: 'regex', operator: 'matches', value: '' })).toEqual({ value: true, max: false });
    expect(ruleInputs({ kind: 'checkboxCount', operator: 'atLeast', value: 1 })).toEqual({ value: true, max: false });
  });
});
