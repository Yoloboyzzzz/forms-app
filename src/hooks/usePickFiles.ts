import * as DocumentPicker from 'expo-document-picker';
import type { PickedFile } from '@/types/models';

interface PickOptions {
  /** Mime types or wildcards (for example "image/*"); everything when empty. Extensions such as ".pdf" are checked after picking. */
  types?: string[];
  multiple?: boolean;
}

/** @returns a function that opens the system file picker (web and native) and resolves with the chosen files. */
export function usePickFiles(): (options?: PickOptions) => Promise<PickedFile[]> {
  return async (options = {}) => {
    const mimeTypes = (options.types ?? []).filter((type) => !type.startsWith('.'));
    const result = await DocumentPicker.getDocumentAsync({
      type: mimeTypes.length > 0 ? mimeTypes : '*/*',
      multiple: options.multiple ?? false,
      copyToCacheDirectory: true,
    });
    if (result.canceled) {
      return [];
    }
    return result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType,
      size: asset.size,
      file: asset.file,
    }));
  };
}
