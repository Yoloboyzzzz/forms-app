import { create } from 'zustand';
import { listMyAssignments } from '@/services/assignmentService';
import { toServiceError } from '@/services/errors';
import type { MyAssignment } from '@/types/models';
import { registerStoreReset } from './storeRegistry';

interface AssignmentsState {
  /** The signed-in user's assigned forms, most recently assigned first. */
  assignments: MyAssignment[];
  isLoaded: boolean;
  isLoading: boolean;
  /** i18n key of the last failed load. */
  errorKey?: string;
  load: (userId: string) => Promise<void>;
  resetAll: () => void;
}

const initialState: Pick<AssignmentsState, 'assignments' | 'isLoaded' | 'isLoading' | 'errorKey'> = {
  assignments: [],
  isLoaded: false,
  isLoading: false,
  errorKey: undefined,
};

export const useAssignmentsStore = create<AssignmentsState>((set) => ({
  ...initialState,

  load: async (userId) => {
    set({ isLoading: true, errorKey: undefined });
    try {
      set({ assignments: await listMyAssignments(userId), isLoaded: true });
    } catch (error) {
      set({ errorKey: toServiceError(error).messageKey });
    } finally {
      set({ isLoading: false });
    }
  },

  resetAll: () => set({ ...initialState }),
}));

registerStoreReset(() => useAssignmentsStore.getState().resetAll());
