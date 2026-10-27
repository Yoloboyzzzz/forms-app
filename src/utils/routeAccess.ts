import { routes } from '@/constants/routes';
import type { AuthSession, Profile } from '@/types/models';

/** Which group of screens is being opened. */
export type RouteArea = 'public' | 'passwordChange' | 'authenticated' | 'admin' | 'user';

export type RouteAccess =
  | { status: 'allowed' }
  /** The profile is still loading; render nothing yet. */
  | { status: 'wait' }
  | { status: 'redirect'; href: string };

const allowed: RouteAccess = { status: 'allowed' };
const wait: RouteAccess = { status: 'wait' };

function redirect(href: string): RouteAccess {
  return { status: 'redirect', href };
}

/**
 * Decides whether the current user may open an area, and where to send them otherwise (AGENTS.md §7.8).
 * This is UX only: Row Level Security is the real guard.
 *
 * Order matters: no session -> login; forced password change blocks everything else; then the role.
 */
export function getRouteAccess(area: RouteArea, session?: AuthSession, profile?: Profile): RouteAccess {
  if (area === 'public') {
    if (session === undefined) return allowed;
    return profile === undefined ? wait : redirect(routes.home);
  }

  if (session === undefined) return redirect(routes.login);
  if (profile === undefined) return wait;

  if (area === 'passwordChange') {
    return profile.mustChangePassword ? allowed : redirect(routes.home);
  }
  if (profile.mustChangePassword) return redirect(routes.changePassword);

  if (area === 'admin') return profile.role === 'admin' ? allowed : redirect(routes.home);
  if (area === 'user') return profile.role === 'user' ? allowed : redirect(routes.home);
  return allowed;
}

/** Home screen of a role; used by the index route. */
export function getHomeRoute(profile: Profile): string {
  return profile.role === 'admin' ? routes.admin.forms : routes.user.forms;
}
