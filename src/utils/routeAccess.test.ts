import type { AuthSession, Profile } from '@/types/models';
import { getHomeRoute, getRouteAccess } from './routeAccess';

const session: AuthSession = { userId: 'u1', email: 'a@b.c' };

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'u1',
    email: 'a@b.c',
    fullName: 'Ann',
    role: 'user',
    mustChangePassword: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

const allowed = { status: 'allowed' };
const wait = { status: 'wait' };
const redirect = (href: string) => ({ status: 'redirect', href });

describe('public area (login, forgot password)', () => {
  it('is open when signed out', () => {
    expect(getRouteAccess('public')).toEqual(allowed);
  });

  it('waits for the profile when a session exists', () => {
    expect(getRouteAccess('public', session)).toEqual(wait);
  });

  it('sends signed-in users home', () => {
    expect(getRouteAccess('public', session, profile())).toEqual(redirect('/'));
  });
});

describe('password change area', () => {
  it('needs a session', () => {
    expect(getRouteAccess('passwordChange')).toEqual(redirect('/login'));
  });

  it('waits for the profile', () => {
    expect(getRouteAccess('passwordChange', session)).toEqual(wait);
  });

  it('is open while the first-time password is active', () => {
    expect(getRouteAccess('passwordChange', session, profile({ mustChangePassword: true }))).toEqual(allowed);
  });

  it('sends users with an active password home', () => {
    expect(getRouteAccess('passwordChange', session, profile())).toEqual(redirect('/'));
  });
});

describe('authenticated, admin and user areas', () => {
  it.each(['authenticated', 'admin', 'user'] as const)('%s needs a session', (area) => {
    expect(getRouteAccess(area)).toEqual(redirect('/login'));
  });

  it.each(['authenticated', 'admin', 'user'] as const)('%s waits for the profile', (area) => {
    expect(getRouteAccess(area, session)).toEqual(wait);
  });

  it.each(['authenticated', 'admin', 'user'] as const)('%s forces the password change first', (area) => {
    expect(getRouteAccess(area, session, profile({ mustChangePassword: true, role: 'admin' }))).toEqual(
      redirect('/change-password'),
    );
  });

  it('lets any signed-in user into the authenticated area', () => {
    expect(getRouteAccess('authenticated', session, profile())).toEqual(allowed);
    expect(getRouteAccess('authenticated', session, profile({ role: 'admin' }))).toEqual(allowed);
  });

  it('keeps users out of the admin area', () => {
    expect(getRouteAccess('admin', session, profile())).toEqual(redirect('/'));
    expect(getRouteAccess('admin', session, profile({ role: 'admin' }))).toEqual(allowed);
  });

  it('keeps admins out of the user area', () => {
    expect(getRouteAccess('user', session, profile({ role: 'admin' }))).toEqual(redirect('/'));
    expect(getRouteAccess('user', session, profile())).toEqual(allowed);
  });
});

describe('getHomeRoute', () => {
  it('routes by role', () => {
    expect(getHomeRoute(profile({ role: 'admin' }))).toBe('/admin/forms');
    expect(getHomeRoute(profile())).toBe('/user/forms');
  });
});
