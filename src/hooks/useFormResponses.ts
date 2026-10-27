import { useEffect, useState } from 'react';
import { toServiceError } from '@/services/errors';
import { getFormResponses, getResponseDetail } from '@/services/responseService';
import type { FormResponses, ResponseDetail } from '@/types/models';

interface Loadable<T> {
  data?: T;
  isLoading: boolean;
  /** i18n key of the failure. */
  errorKey?: string;
  reload: () => void;
}

/** Loads something once per change of `key` and offers a reload. The data belongs to one screen, so it stays local. */
function useLoaded<T>(key: string, load: () => Promise<T>): Loadable<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | undefined>(undefined);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorKey(undefined);
    load()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((error: unknown) => {
        if (!cancelled) setErrorKey(toServiceError(error).messageKey);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `load` is a fresh closure on every render; the key identifies what is loaded.
  }, [key, reloadCount]);

  return { data, isLoading, errorKey, reload: () => setReloadCount((count) => count + 1) };
}

/** Who has the form, how far they are, and the submitted answers. */
export function useFormResponses(formId: string): Loadable<FormResponses> {
  return useLoaded(`responses-${formId}`, () => getFormResponses(formId));
}

/** One response with its answers. */
export function useResponseDetail(submissionId: string): Loadable<ResponseDetail> {
  return useLoaded(`response-${submissionId}`, () => getResponseDetail(submissionId));
}
