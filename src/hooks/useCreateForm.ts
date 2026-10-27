import { useState } from 'react';
import { toServiceError } from '@/services/errors';
import { useAuthStore } from '@/state/useAuthStore';
import { useFormsStore } from '@/state/useFormsStore';
import type { Form } from '@/types/models';

interface UseCreateForm {
  /** @returns the new form, or undefined when creating failed (see `errorKey`). */
  createForm: (draft: { title: string; description?: string }) => Promise<Form | undefined>;
  isLoading: boolean;
  errorKey?: string;
}

/** Creates a draft form owned by the signed-in admin. */
export function useCreateForm(): UseCreateForm {
  const create = useFormsStore((state) => state.create);
  const userId = useAuthStore((state) => state.session?.userId);
  const [isLoading, setIsLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | undefined>(undefined);

  async function createForm(draft: { title: string; description?: string }): Promise<Form | undefined> {
    if (userId === undefined) {
      return undefined;
    }
    setErrorKey(undefined);
    setIsLoading(true);
    try {
      return await create(draft, userId);
    } catch (error) {
      setErrorKey(toServiceError(error).messageKey);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }

  return { createForm, isLoading, errorKey };
}
