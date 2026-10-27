import { Stack } from 'expo-router';
import { RouteGuard } from '@/components/RouteGuard';
import { useRouteAccess } from '@/hooks/useRouteAccess';

export default function UserLayout() {
  const access = useRouteAccess('user');

  return (
    <RouteGuard access={access}>
      <Stack screenOptions={{ headerShown: false }} />
    </RouteGuard>
  );
}
