import { create } from 'zustand';
import {
  createUser as createUserService,
  listUsers,
  resetPassword as resetPasswordService,
  setUserRole as setUserRoleService,
  type NewUserInput,
} from '@/services/adminUserService';
import { toServiceError } from '@/services/errors';
import type { UserRole } from '@/types/enums';
import type { Profile } from '@/types/models';
import { registerStoreReset } from './storeRegistry';

interface UsersState {
  users: Profile[];
  /** True after the first successful load. */
  isLoaded: boolean;
  isLoading: boolean;
  /** i18n key of the last failed load. */
  errorKey?: string;
  load: () => Promise<void>;
  /** @returns the id of the new user. */
  createUser: (input: NewUserInput) => Promise<string>;
  resetPassword: (userId: string, password: string) => Promise<void>;
  setRole: (userId: string, role: UserRole) => Promise<void>;
  resetAll: () => void;
}

const initialState = { users: [], isLoaded: false, isLoading: false, errorKey: undefined } as const;

export const useUsersStore = create<UsersState>((set, get) => ({
  ...initialState,

  load: async () => {
    set({ isLoading: true, errorKey: undefined });
    try {
      set({ users: await listUsers(), isLoaded: true });
    } catch (error) {
      set({ errorKey: toServiceError(error).messageKey });
    } finally {
      set({ isLoading: false });
    }
  },

  createUser: async (input) => {
    const userId = await createUserService(input);
    await get().load();
    return userId;
  },

  resetPassword: (userId, password) => resetPasswordService(userId, password),

  setRole: async (userId, role) => {
    await setUserRoleService(userId, role);
    await get().load();
  },

  resetAll: () => set({ ...initialState, users: [] }),
}));

registerStoreReset(() => useUsersStore.getState().resetAll());
