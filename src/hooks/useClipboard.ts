import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';

interface UseClipboard {
  /** True right after a successful copy. */
  copied: boolean;
  copy: (text: string) => Promise<void>;
  reset: () => void;
}

/** Copies text to the system clipboard (web and native). */
export function useClipboard(): UseClipboard {
  const [copied, setCopied] = useState(false);

  async function copy(text: string): Promise<void> {
    setCopied(await Clipboard.setStringAsync(text));
  }

  return { copied, copy, reset: () => setCopied(false) };
}
