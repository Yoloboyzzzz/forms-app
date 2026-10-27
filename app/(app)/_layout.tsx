import { Stack } from 'expo-router';
import { RouteGuard } from '@/components/RouteGuard';
import { useRouteAccess } from '@/hooks/useRouteAccess';

export default function AppLayout() {
  const access = useRouteAccess('authenticated');

  return (
    <RouteGuard access={access}>
      <Stack screenOptions={{ headerShown: false }} />
    </RouteGuard>
  );
}
