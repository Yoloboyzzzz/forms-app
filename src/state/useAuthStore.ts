import { create } from 'zustand';
import {
  changePassword as changePasswordService,
  getSession,
  onAuthStateChange,
  signIn as signInService,
  signOut as signOutService,
} from '@/services/authService';
import { toServiceError } from '@/services/errors';
import { getMyProfile, updateMyName } from '@/services/profileService';
import type { AuthSession, Profile } from '@/types/models';
import { registerStoreReset, resetAllStores } from './storeRegistry';

interface AuthState {
  session?: AuthSession;
  profile?: Profile;
  /** False until the stored session (and its profile) has been restored; the splash screen waits for it. */
  isBootstrapped: boolean;
  /** An action (sign in, password change, ...) is running. */
  isLoading: boolean;
  /** i18n key when restoring the session failed. */
  bootstrapError?: string;
  /** Restores the session and keeps it in sync; returns the cleanup function. */
  bootstrap: () => Promise<() => void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateName: (fullName: string) => Promise<void>;
  resetAll: () => void;
}

const initialState = {
  session: undefined,
  profile: undefined,
  isBootstrapped: false,
  isLoading: false,
  bootstrapError: undefined,
} as const;

export const useAuthStore = create<AuthState>((set, get) => {
  /** Reuses a running request so sign-in and the auth listener do not load the same profile twice. */
  let profileRequest: { userId: string; promise: Promise<Profile> } | undefined;

  function loadProfile(userId: string): Promise<Profile> {
    if (profileRequest?.userId === userId) {
      return profileRequest.promise;
    }
    const promise = getMyProfile(userId).finally(() => {
      if (profileRequest?.promise === promise) {
        profileRequest = undefined;
      }
    });
    profileRequest = { userId, promise };
    return promise;
  }

  async function withLoading<T>(action: () => Promise<T>): Promise<T> {
    set({ isLoading: true });
    try {
      return await action();
    } finally {
      set({ isLoading: false });
    }
  }

  return {
    ...initialState,

    bootstrap: async () => {
      const unsubscribe = onAuthStateChange((session) => {
        const current = get().session;
        if (session === undefined) {
          if (current !== undefined) {
            get().resetAll();
          }
          return;
        }
        if (current?.userId === session.userId) {
          return;
        }
        set({ session });
        // supabase-js holds a lock while calling this listener, so other calls must run after it returns.
        setTimeout(() => {
          loadProfile(session.userId)
            .then((profile) => set({ profile }))
            .catch(() => set({ bootstrapError: 'errors.unknown' }));
        }, 0);
      });

      try {
        const session = await getSession();
        if (session !== undefined) {
          const profile = await loadProfile(session.userId);
          set({ session, profile });
        }
        set({ isBootstrapped: true, bootstrapError: undefined });
      } catch (error) {
        set({ isBootstrapped: true, bootstrapError: toServiceError(error).messageKey });
      }
      return unsubscribe;
    },

    signIn: (email, password) =>
      withLoading(async () => {
        const session = await signInService(email, password);
        try {
          const profile = await loadProfile(session.userId);
          set({ session, profile });
        } catch (error) {
          await signOutService().catch(() => undefined);
          throw error;
        }
      }),

    signOut: async () => {
      try {
        await signOutService();
      } finally {
        get().resetAll();
      }
    },

    changePassword: (newPassword) =>
      withLoading(async () => {
        await changePasswordService(newPassword);
        await get().refreshProfile();
      }),

    refreshProfile: async () => {
      const session = get().session;
      if (session === undefined) {
        return;
      }
      set({ profile: await getMyProfile(session.userId) });
    },

    updateName: (fullName) =>
      withLoading(async () => {
        const session = get().session;
        if (session === undefined) {
          return;
        }
        set({ profile: await updateMyName(session.userId, fullName) });
      }),

    resetAll: () => resetAllStores(),
  };
});

// Logging out clears the auth store itself as well as every other registered store.
registerStoreReset(() => useAuthStore.setState({ ...initialState, isBootstrapped: true }));
