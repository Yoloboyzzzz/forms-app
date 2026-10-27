import { useState } from 'react';
import { Linking } from 'react-native';
import { toServiceError } from '@/services/errors';
import { getSignedUrl, type Bucket } from '@/services/storageService';

interface UseOpenFile {
  /** Opens a private file through a temporary link (a new tab on web, the browser or viewer on a device). */
  open: (bucket: Bucket, path: string) => Promise<void>;
  /** i18n key when the file could not be opened. */
  errorKey?: string;
}

export function useOpenFile(): UseOpenFile {
  const [errorKey, setErrorKey] = useState<string | undefined>(undefined);

  async function open(bucket: Bucket, path: string): Promise<void> {
    setErrorKey(undefined);
    try {
      await Linking.openURL(await getSignedUrl(bucket, path));
    } catch (error) {
      setErrorKey(toServiceError(error).messageKey);
    }
  }

  return { open, errorKey };
}
