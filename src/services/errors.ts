import { isRecord, readNumber, readString } from './mappers/json';

export type ServiceErrorCode =
  | 'unknown'
  | 'network'
  | 'forbidden'
  | 'notFound'
  | 'duplicate'
  | 'invalidCredentials'
  | 'weakPassword'
  | 'rateLimited'
  | 'invalidCode'
  | 'samePassword'
  | 'invalidInput'
  | 'inUse';

/** Typed error thrown by every service. `messageKey` is an i18n key; the UI translates it. */
export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly messageKey: string;

  constructor(code: ServiceErrorCode, cause?: unknown) {
    super(`Service error: ${code}`, { cause });
    this.name = 'ServiceError';
    this.code = code;
    this.messageKey = `errors.${code}`;
  }
}

const CODE_MAP: Record<string, ServiceErrorCode> = {
  '42501': 'forbidden',
  insufficient_privilege: 'forbidden',
  forbidden: 'forbidden',
  PGRST116: 'notFound',
  user_not_found: 'notFound',
  '23505': 'duplicate',
  email_exists: 'duplicate',
  user_already_exists: 'duplicate',
  invalid_credentials: 'invalidCredentials',
  weak_password: 'weakPassword',
  over_request_rate_limit: 'rateLimited',
  over_email_send_rate_limit: 'rateLimited',
  otp_expired: 'invalidCode',
  otp_disabled: 'invalidCode',
  same_password: 'samePassword',
  invalid_input: 'invalidInput',
  '23503': 'inUse',
};

const NETWORK_PATTERN = /network|failed to fetch|fetch failed/i;

/**
 * Converts anything a Supabase call can return or throw (PostgREST, Auth, Functions errors) into a ServiceError.
 * Never leaks the raw message to the UI: logging passwords or answers is forbidden (AGENTS.md §13).
 */
export function toServiceError(error: unknown): ServiceError {
  if (error instanceof ServiceError) {
    return error;
  }
  if (!isRecord(error) && !(error instanceof Error)) {
    return new ServiceError('unknown', error);
  }
  const record: Record<string, unknown> = error instanceof Error ? { ...error, message: error.message, name: error.name } : error;
  const code = readString(record, 'code');
  const mapped = code === undefined ? undefined : CODE_MAP[code];
  if (mapped !== undefined) {
    return new ServiceError(mapped, error);
  }
  const status = readNumber(record, 'status');
  if (status === 403) {
    return new ServiceError('forbidden', error);
  }
  if (status === 429) {
    return new ServiceError('rateLimited', error);
  }
  const message = readString(record, 'message') ?? '';
  const name = readString(record, 'name') ?? '';
  if (NETWORK_PATTERN.test(message) || name === 'AuthRetryableFetchError' || name === 'FunctionsFetchError') {
    return new ServiceError('network', error);
  }
  return new ServiceError('unknown', error);
}

/** Throws when a Supabase response carries an error; keeps services free of repeated `if (error)` mapping. */
export function throwIfError(error: unknown): void {
  if (error !== null && error !== undefined) {
    throw toServiceError(error);
  }
}
