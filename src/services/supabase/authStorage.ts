import { Platform } from 'react-native';
import { LargeSecureStore } from './largeSecureStore';

/**
 * Web: undefined, so supabase-js uses localStorage (and memory during static rendering).
 * Native: encrypted session storage.
 */
export const authStorage = Platform.OS === 'web' ? undefined : new LargeSecureStore();
