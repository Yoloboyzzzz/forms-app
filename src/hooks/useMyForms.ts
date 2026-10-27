import { useEffect, useState } from 'react';
import { useAssignmentsStore } from '@/state/useAssignmentsStore';
import { useAuthStore } from '@/state/useAuthStore';
import type { MyAssignment } from '@/types/models';
import { isSubmitted } from '@/utils/assignmentStatus';

export type MyFormsTab = 'todo' | 'submitted';

interface UseMyForms {
  tab: MyFormsTab;
  setTab: (tab: MyFormsTab) => void;
  /** Assignments of the selected tab. */
  items: MyAssignment[];
  isLoaded: boolean;
  isLoading: boolean;
  errorKey?: string;
  reload: () => void;
}

/** Glue for "My forms": loads the user's assignments on mount and splits them into to do and submitted. */
export function useMyForms(): UseMyForms {
  const userId = useAuthStore((state) => state.session?.userId);
  const assignments = useAssignmentsStore((state) => state.assignments);
  const isLoaded = useAssignmentsStore((state) => state.isLoaded);
  const isLoading = useAssignmentsStore((state) => state.isLoading);
  const errorKey = useAssignmentsStore((state) => state.errorKey);
  const load = useAssignmentsStore((state) => state.load);
  const [tab, setTab] = useState<MyFormsTab>('todo');

  useEffect(() => {
    if (userId !== undefined) void load(userId);
  }, [userId, load]);

  return {
    tab,
    setTab,
    items: assignments.filter((item) => isSubmitted(item) === (tab === 'submitted')),
    isLoaded,
    isLoading,
    errorKey,
    reload: () => {
      if (userId !== undefined) void load(userId);
    },
  };
}
