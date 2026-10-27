import { Redirect } from 'expo-router';
import { useAuthStore } from '@/state/useAuthStore';
import { getHomeRoute } from '@/utils/routeAccess';

/** Sends each role to its own home; the (app) layout has already made sure the profile is loaded. */
export default function AppIndex() {
  const profile = useAuthStore((state) => state.profile);

  if (profile === undefined) {
    return null;
  }
  return <Redirect href={getHomeRoute(profile)} />;
}
