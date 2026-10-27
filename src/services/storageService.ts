import type { PickedFile } from '../types/models';
import { buildAnswerFilePath, buildQuestionImagePath } from '../utils/uploads';
import { ServiceError, throwIfError } from './errors';
import { supabase } from './supabase/client';

export type Bucket = 'form-uploads' | 'form-media';

const SIGNED_URL_SECONDS = 60 * 60;

/** The content of a picked file: the browser File on web, else the file read from its device uri. */
async function contentOf(file: PickedFile): Promise<Blob> {
  if (file.file !== undefined) {
    return file.file;
  }
  const response = await fetch(file.uri);
  return response.blob();
}

async function upload(bucket: Bucket, path: string, file: PickedFile): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, await contentOf(file), {
    contentType: file.mimeType,
    upsert: false,
  });
  throwIfError(error);
  return path;
}

/**
 * Uploads a file a respondent attached to a question. Users may only write inside their own folder (storage policy).
 * @returns the storage path to keep in the answer.
 */
export async function uploadAnswerFile(
  userId: string,
  submissionId: string,
  questionId: string,
  file: PickedFile,
): Promise<string> {
  return upload('form-uploads', buildAnswerFilePath(userId, submissionId, questionId, file.name, new Date()), file);
}

/** Uploads the image an admin attached to a question. Admins only (storage policy). */
export async function uploadQuestionImage(formId: string, questionId: string, file: PickedFile): Promise<string> {
  return upload('form-media', buildQuestionImagePath(formId, questionId, file.name, new Date()), file);
}

/** Deletes files from a bucket. Missing files are not an error. */
export async function deleteFiles(bucket: Bucket, paths: string[]): Promise<void> {
  if (paths.length === 0) {
    return;
  }
  const { error } = await supabase.storage.from(bucket).remove(paths);
  throwIfError(error);
}

/**
 * A temporary link to a private file. Files are never public (AGENTS.md §7.7).
 * @throws ServiceError `notFound` when the file does not exist or the user may not read it.
 */
export async function getSignedUrl(bucket: Bucket, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_SECONDS);
  throwIfError(error);
  if (data === null) {
    throw new ServiceError('notFound');
  }
  return data.signedUrl;
}

/** Temporary links for several files at once; paths that cannot be signed are left out. */
export async function getSignedUrls(bucket: Bucket, paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) {
    return {};
  }
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, SIGNED_URL_SECONDS);
  throwIfError(error);
  const urls: Record<string, string> = {};
  for (const entry of data ?? []) {
    if (entry.path !== null && entry.signedUrl !== null && entry.signedUrl !== '' && entry.error === null) {
      urls[entry.path] = entry.signedUrl;
    }
  }
  return urls;
}
