import { useEffect, useState } from 'react';
import { useFormsStore } from '@/state/useFormsStore';
import type { StatusFilterValue } from '@/components/StatusFilter';
import type { Form } from '@/types/models';

interface UseAdminForms {
  /** Forms matching the selected filter. */
  forms: Form[];
  filter: StatusFilterValue;
  setFilter: (filter: StatusFilterValue) => void;
  isLoaded: boolean;
  isLoading: boolean;
  errorKey?: string;
  reload: () => void;
}

/** Glue for the admin forms list: loads on mount and filters by status. */
export function useAdminForms(): UseAdminForms {
  const allForms = useFormsStore((state) => state.forms);
  const isLoaded = useFormsStore((state) => state.isLoaded);
  const isLoading = useFormsStore((state) => state.isLoading);
  const errorKey = useFormsStore((state) => state.errorKey);
  const load = useFormsStore((state) => state.load);
  const [filter, setFilter] = useState<StatusFilterValue>('all');

  useEffect(() => {
    void load();
  }, [load]);

  return {
    forms: filter === 'all' ? allForms : allForms.filter((form) => form.status === filter),
    filter,
    setFilter,
    isLoaded,
    isLoading,
    errorKey,
    reload: () => void load(),
  };
}
