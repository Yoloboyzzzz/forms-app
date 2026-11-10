import Constants from 'expo-constants';
import { useEffect } from 'react';

/**
 * Service workers are only registered in production builds (cached files would go stale while developing)
 * and only where the browser supports them.
 */
export function canRegisterServiceWorker(nodeEnv: string | undefined, nav: Pick<Navigator, 'serviceWorker'> | undefined): boolean {
  return nodeEnv === 'production' && nav !== undefined && 'serviceWorker' in nav;
}

/** Where the worker file lives: next to the app, which may be hosted under a sub path such as /forms. */
export function serviceWorkerUrl(baseUrl: string | undefined): string {
  return `${(baseUrl ?? '').replace(/\/$/, '')}/sw.js`;
}

/** Registers the service worker of the PWA, so the app shell works offline. */
export function useRegisterServiceWorker(): void {
  useEffect(() => {
    if (!canRegisterServiceWorker(process.env.NODE_ENV, typeof navigator === 'undefined' ? undefined : navigator)) {
      return;
    }
    navigator.serviceWorker.register(serviceWorkerUrl(Constants.expoConfig?.experiments?.baseUrl)).catch(() => {
      // Without a service worker the app still works online; nothing to tell the user.
    });
  }, []);
}
