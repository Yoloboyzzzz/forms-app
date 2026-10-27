import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useAuthStore } from '@/state/useAuthStore';

// Keep the splash screen up until the stored session is restored, so no wrong screen flashes by.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/**
 * Restores the session once and keeps it in sync with Supabase for the app's lifetime.
 * @returns true when the app can render its routes.
 */
export function useAppBootstrap(): boolean {
  const isBootstrapped = useAuthStore((state) => state.isBootstrapped);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void bootstrap().then((stop) => {
      if (cancelled) {
        stop();
      } else {
        cleanup = stop;
      }
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [bootstrap]);

  useEffect(() => {
    if (isBootstrapped) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [isBootstrapped]);

  return isBootstrapped;
}
