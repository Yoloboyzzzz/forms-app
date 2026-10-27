import { useEffect, useState } from 'react';
import { getSignedUrls, type Bucket } from '@/services/storageService';

/**
 * Temporary links for private files, by path. Links are fetched in one request whenever the set of paths changes;
 * paths that cannot be signed are simply missing from the result.
 */
export function useSignedUrls(bucket: Bucket, paths: string[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = [...paths].sort().join('|');

  useEffect(() => {
    if (key === '') {
      setUrls({});
      return undefined;
    }
    let cancelled = false;
    getSignedUrls(bucket, key.split('|'))
      .then((result) => {
        if (!cancelled) setUrls(result);
      })
      .catch(() => {
        // Without a link the image is just not shown; the question itself still works.
      });
    return () => {
      cancelled = true;
    };
  }, [bucket, key]);

  return urls;
}
