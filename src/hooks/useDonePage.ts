import { useEffect, useState } from 'react';
import { toServiceError } from '@/services/errors';
import { useFillStore } from '@/state/useFillStore';
import type { Form } from '@/types/models';

interface UseDonePage {
  isLoading: boolean;
  errorKey?: string;
  form?: Form;
  /** True once the response is known to be submitted. */
  isSubmitted: boolean;
  /** Reopens the response for editing; resolves true when it worked. */
  edit: () => Promise<boolean>;
  isEditing: boolean;
  /** i18n key when reopening failed. */
  editErrorKey?: string;
}

/** Glue for the confirmation page. Loads the assignment when the page is opened directly (for example after a reload). */
export function useDonePage(assignmentId: string): UseDonePage {
  const assignmentInStore = useFillStore((state) => state.assignmentId);
  const detail = useFillStore((state) => state.detail);
  const submission = useFillStore((state) => state.submission);
  const isLoading = useFillStore((state) => state.isLoading);
  const errorKey = useFillStore((state) => state.errorKey);
  const [isEditing, setIsEditing] = useState(false);
  const [editErrorKey, setEditErrorKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (assignmentInStore !== assignmentId) void useFillStore.getState().load(assignmentId);
  }, [assignmentInStore, assignmentId]);

  return {
    isLoading,
    errorKey,
    form: detail?.form,
    isSubmitted: submission?.status === 'submitted',
    edit: async () => {
      setEditErrorKey(undefined);
      setIsEditing(true);
      try {
        await useFillStore.getState().reopen();
        return true;
      } catch (error) {
        setEditErrorKey(toServiceError(error).messageKey);
        return false;
      } finally {
        setIsEditing(false);
      }
    },
    isEditing,
    editErrorKey,
  };
}
