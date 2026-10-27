import type { FileUploadSettings, PickedFile } from '@/types/models';

/** Default limits from AGENTS.md D23. */
export const DEFAULT_MAX_FILE_SIZE_MB = 10;
export const DEFAULT_MAX_FILES = 1;
/** Question images are small; the bucket allows 5 MB. */
export const MAX_QUESTION_IMAGE_MB = 5;

export type UploadError = 'tooLarge' | 'wrongType' | 'tooMany';

/** Lower-case file extension including the dot, or an empty string. */
function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

/** Whether a file matches one allowed type: a mime type ("application/pdf"), a wildcard ("image/*") or an extension (".pdf"). */
function matchesType(file: Pick<PickedFile, 'name' | 'mimeType'>, allowed: string): boolean {
  const rule = allowed.trim().toLowerCase();
  if (rule.startsWith('.')) return extensionOf(file.name) === rule;
  const mime = (file.mimeType ?? '').toLowerCase();
  return rule.endsWith('/*') ? mime.startsWith(rule.slice(0, -1)) : mime === rule;
}

/**
 * Checks a picked file against a question's upload settings before anything is uploaded.
 * `existingCount` is how many files the respondent already added to this question.
 */
export function checkUpload(
  file: Pick<PickedFile, 'name' | 'mimeType' | 'size'>,
  existingCount: number,
  settings: FileUploadSettings,
): UploadError | undefined {
  if (existingCount >= (settings.maxFiles ?? DEFAULT_MAX_FILES)) return 'tooMany';
  const allowed = settings.allowedTypes ?? [];
  if (allowed.length > 0 && !allowed.some((type) => matchesType(file, type))) return 'wrongType';
  const limit = (settings.maxFileSizeMb ?? DEFAULT_MAX_FILE_SIZE_MB) * 1024 * 1024;
  if (file.size !== undefined && file.size > limit) return 'tooLarge';
  return undefined;
}

/** A file name that is safe in a storage path. */
export function safeFileName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
  return cleaned === '' ? 'file' : cleaned;
}

/** `<user>/<submission>/<question>/<timestamp>-<name>`: the folder layout the storage policies expect (AGENTS.md §7.7). */
export function buildAnswerFilePath(userId: string, submissionId: string, questionId: string, name: string, now: Date): string {
  return `${userId}/${submissionId}/${questionId}/${now.getTime()}-${safeFileName(name)}`;
}

/** `<form>/<question>/<timestamp>-<name>` for question images. */
export function buildQuestionImagePath(formId: string, questionId: string, name: string, now: Date): string {
  return `${formId}/${questionId}/${now.getTime()}-${safeFileName(name)}`;
}

/** The original file name from a stored path (drops the folders and the timestamp prefix). */
export function fileNameOf(path: string): string {
  const last = path.slice(path.lastIndexOf('/') + 1);
  return last.replace(/^\d+-/, '');
}
