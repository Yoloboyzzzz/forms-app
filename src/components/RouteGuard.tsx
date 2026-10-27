import { Redirect } from 'expo-router';
import type { RouteAccess } from '@/utils/routeAccess';

interface RouteGuardProps {
  access: RouteAccess;
  children: React.ReactNode;
}

/** Renders the screens only when access is allowed; otherwise redirects, or renders nothing while the profile loads. */
export function RouteGuard({ access, children }: RouteGuardProps) {
  if (access.status === 'redirect') {
    return <Redirect href={access.href} />;
  }
  if (access.status === 'wait') {
    return null;
  }
  return <>{children}</>;
}
