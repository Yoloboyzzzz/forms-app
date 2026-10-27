import { useAuthStore } from '@/state/useAuthStore';
import { getRouteAccess, type RouteAccess, type RouteArea } from '@/utils/routeAccess';

/** Access decision for a screen group, based on the current session and profile. */
export function useRouteAccess(area: RouteArea): RouteAccess {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  return getRouteAccess(area, session, profile);
}
