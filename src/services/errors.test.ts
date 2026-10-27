import { ServiceError, throwIfError, toServiceError } from './errors';

describe('ServiceError', () => {
  it('carries a code and an i18n key', () => {
    const error = new ServiceError('duplicate');
    expect(error.code).toBe('duplicate');
    expect(error.messageKey).toBe('errors.duplicate');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('toServiceError', () => {
  it.each([
    [{ code: '42501', message: 'x' }, 'forbidden'],
    [{ code: 'PGRST116', message: 'x' }, 'notFound'],
    [{ code: '23505', message: 'x' }, 'duplicate'],
    [{ code: 'email_exists', message: 'x' }, 'duplicate'],
    [{ code: 'invalid_credentials', message: 'x' }, 'invalidCredentials'],
    [{ code: 'weak_password', message: 'x' }, 'weakPassword'],
    [{ code: 'over_email_send_rate_limit', message: 'x' }, 'rateLimited'],
    [{ code: 'otp_expired', message: 'x' }, 'invalidCode'],
    [{ code: 'same_password', message: 'x' }, 'samePassword'],
    [{ code: 'invalid_input', message: 'x' }, 'invalidInput'],
    [{ status: 403, message: 'x' }, 'forbidden'],
    [{ status: 429, message: 'x' }, 'rateLimited'],
    [{ message: 'Network request failed' }, 'network'],
    [{ name: 'AuthRetryableFetchError', message: 'x' }, 'network'],
    [{ name: 'FunctionsFetchError', message: 'x' }, 'network'],
    [{ code: 'weird', message: 'boom' }, 'unknown'],
    [{}, 'unknown'],
  ])('maps %j to %s', (input, code) => {
    expect(toServiceError(input).code).toBe(code);
  });

  it('maps real Error instances', () => {
    expect(toServiceError(new TypeError('Failed to fetch')).code).toBe('network');
    expect(toServiceError(new Error('boom')).code).toBe('unknown');
  });

  it('maps non-object values to unknown', () => {
    expect(toServiceError('text').code).toBe('unknown');
    expect(toServiceError(undefined).code).toBe('unknown');
  });

  it('returns an existing ServiceError unchanged', () => {
    const original = new ServiceError('notFound');
    expect(toServiceError(original)).toBe(original);
  });

  it('keeps the original error as cause', () => {
    const cause = { code: '23505', message: 'x' };
    expect(toServiceError(cause).cause).toBe(cause);
  });
});

describe('throwIfError', () => {
  it('does nothing without an error', () => {
    expect(() => throwIfError(null)).not.toThrow();
    expect(() => throwIfError(undefined)).not.toThrow();
  });

  it('throws a ServiceError', () => {
    expect(() => throwIfError({ code: '42501', message: 'x' })).toThrow(ServiceError);
  });
});
