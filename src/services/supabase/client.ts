import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { env } from '@/config/env';
import type { Database } from '@/types/supabase';
import { authStorage } from './authStorage';

/** The only place `createClient` is called. */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Native apps only refresh tokens while in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
