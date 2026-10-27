import {
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
  validateRecoveryCode,
  validateRequired,
} from './authValidation';

describe('validateEmail', () => {
  it('requires a value', () => {
    expect(validateEmail('  ')).toBe('validation.required');
  });

  it('rejects malformed addresses', () => {
    expect(validateEmail('nope')).toBe('validation.emailInvalid');
    expect(validateEmail('a@b')).toBe('validation.emailInvalid');
  });

  it('accepts addresses, ignoring surrounding spaces', () => {
    expect(validateEmail(' a@b.co ')).toBeUndefined();
  });
});

describe('validateRequired', () => {
  it('rejects blank values only', () => {
    expect(validateRequired('')).toBe('validation.required');
    expect(validateRequired('  ')).toBe('validation.required');
    expect(validateRequired('x')).toBeUndefined();
  });
});

describe('validateNewPassword', () => {
  it('requires a value', () => {
    expect(validateNewPassword('')).toBe('validation.required');
  });

  it('enforces the minimum length of 8', () => {
    expect(validateNewPassword('1234567')).toBe('validation.passwordTooShort');
    expect(validateNewPassword('12345678')).toBeUndefined();
  });
});

describe('validatePasswordConfirmation', () => {
  it('requires a value', () => {
    expect(validatePasswordConfirmation('abc', '')).toBe('validation.required');
  });

  it('must match', () => {
    expect(validatePasswordConfirmation('abc', 'abd')).toBe('validation.passwordsDoNotMatch');
    expect(validatePasswordConfirmation('abc', 'abc')).toBeUndefined();
  });
});

describe('validateRecoveryCode', () => {
  it('requires six digits', () => {
    expect(validateRecoveryCode('')).toBe('validation.required');
    expect(validateRecoveryCode('12345')).toBe('validation.codeInvalid');
    expect(validateRecoveryCode('12a456')).toBe('validation.codeInvalid');
    expect(validateRecoveryCode(' 123456 ')).toBeUndefined();
  });
});
