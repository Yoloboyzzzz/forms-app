import { Stack } from 'expo-router';
import { RouteGuard } from '@/components/RouteGuard';
import { useRouteAccess } from '@/hooks/useRouteAccess';

export default function AdminLayout() {
  const access = useRouteAccess('admin');

  return (
    <RouteGuard access={access}>
      <Stack screenOptions={{ headerShown: false }} />
    </RouteGuard>
  );
}
