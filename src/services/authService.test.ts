import {
  changePassword,
  getSession,
  onAuthStateChange,
  requestPasswordReset,
  resetPasswordWithCode,
  signIn,
  signOut,
} from './authService';
import { ServiceError } from './errors';

const mockAuth = {
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  updateUser: jest.fn(),
  resetPasswordForEmail: jest.fn(),
  verifyOtp: jest.fn(),
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
};

// Resolved lazily: the factory runs when the service is imported, before the const above is initialised.
jest.mock('@/services/supabase/client', () => ({
  supabase: {
    get auth() {
      return mockAuth;
    },
  },
}));

const session = { user: { id: 'u1', email: 'a@b.c' } };

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof ServiceError ? error.code : 'not-a-service-error';
  }
}

beforeEach(() => jest.resetAllMocks());

describe('signIn', () => {
  it('signs in with a trimmed email and returns the session identity', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ data: { session }, error: null });
    await expect(signIn(' a@b.c ', 'secret123')).resolves.toEqual({ userId: 'u1', email: 'a@b.c' });
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.c', password: 'secret123' });
  });

  it('uses an empty email when the user has none', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null });
    await expect(signIn('a@b.c', 'x')).resolves.toEqual({ userId: 'u1', email: '' });
  });

  it('maps wrong credentials', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    expect(await codeOf(signIn('a@b.c', 'bad'))).toBe('invalidCredentials');
  });

  it('fails when no session comes back', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: null });
    expect(await codeOf(signIn('a@b.c', 'x'))).toBe('unknown');
  });
});

describe('signOut', () => {
  it('signs out', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null });
    await expect(signOut()).resolves.toBeUndefined();
  });

  it('throws service errors', async () => {
    mockAuth.signOut.mockResolvedValue({ error: { message: 'Failed to fetch' } });
    expect(await codeOf(signOut())).toBe('network');
  });
});

describe('changePassword', () => {
  it('updates the password', async () => {
    mockAuth.updateUser.mockResolvedValue({ error: null });
    await changePassword('new-secret-1');
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'new-secret-1' });
  });

  it.each([
    ['weak_password', 'weakPassword'],
    ['same_password', 'samePassword'],
  ])('maps %s', async (code, expected) => {
    mockAuth.updateUser.mockResolvedValue({ error: { code, message: 'x' } });
    expect(await codeOf(changePassword('x'))).toBe(expected);
  });
});

describe('requestPasswordReset', () => {
  it('sends the email', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
    await requestPasswordReset(' a@b.c ');
    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.c');
  });

  it('hides unknown-address errors', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ error: { code: 'user_not_found', message: 'x' } });
    await expect(requestPasswordReset('nobody@b.c')).resolves.toBeUndefined();
  });

  it.each([
    [{ code: 'over_email_send_rate_limit', message: 'x' }, 'rateLimited'],
    [{ message: 'Network request failed' }, 'network'],
  ])('reports %j', async (error, expected) => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ error });
    expect(await codeOf(requestPasswordReset('a@b.c'))).toBe(expected);
  });
});

describe('resetPasswordWithCode', () => {
  it('verifies the code, then sets the password', async () => {
    mockAuth.verifyOtp.mockResolvedValue({ error: null });
    mockAuth.updateUser.mockResolvedValue({ error: null });
    await resetPasswordWithCode(' a@b.c ', ' 123456 ', 'new-secret-1');
    expect(mockAuth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.c', token: '123456', type: 'recovery' });
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'new-secret-1' });
  });

  it('reports a wrong or expired code and does not change the password', async () => {
    mockAuth.verifyOtp.mockResolvedValue({ error: { code: 'otp_expired', message: 'x' } });
    expect(await codeOf(resetPasswordWithCode('a@b.c', '000000', 'x'))).toBe('invalidCode');
    expect(mockAuth.updateUser).not.toHaveBeenCalled();
  });

  it('treats generic verification failures as an invalid code', async () => {
    mockAuth.verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } });
    expect(await codeOf(resetPasswordWithCode('a@b.c', '000000', 'x'))).toBe('invalidCode');
  });

  it('keeps other verification errors', async () => {
    mockAuth.verifyOtp.mockResolvedValue({ error: { code: 'over_request_rate_limit', message: 'x' } });
    expect(await codeOf(resetPasswordWithCode('a@b.c', '000000', 'x'))).toBe('rateLimited');
  });

  it('reports a weak new password', async () => {
    mockAuth.verifyOtp.mockResolvedValue({ error: null });
    mockAuth.updateUser.mockResolvedValue({ error: { code: 'weak_password', message: 'x' } });
    expect(await codeOf(resetPasswordWithCode('a@b.c', '123456', '1'))).toBe('weakPassword');
  });
});

describe('getSession', () => {
  it('returns the restored session', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session }, error: null });
    await expect(getSession()).resolves.toEqual({ userId: 'u1', email: 'a@b.c' });
  });

  it('returns undefined when signed out', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(getSession()).resolves.toBeUndefined();
  });

  it('throws service errors', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: { message: 'Failed to fetch' } });
    expect(await codeOf(getSession())).toBe('network');
  });
});

describe('onAuthStateChange', () => {
  it('forwards sessions and unsubscribes on cleanup', () => {
    const unsubscribe = jest.fn();
    let listener: ((event: string, session: unknown) => void) | undefined;
    mockAuth.onAuthStateChange.mockImplementation((callback: (event: string, session: unknown) => void) => {
      listener = callback;
      return { data: { subscription: { unsubscribe } } };
    });
    const callback = jest.fn();

    const stop = onAuthStateChange(callback);
    listener?.('SIGNED_IN', session);
    listener?.('SIGNED_OUT', null);
    stop();

    expect(callback).toHaveBeenNthCalledWith(1, { userId: 'u1', email: 'a@b.c' });
    expect(callback).toHaveBeenNthCalledWith(2, undefined);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
