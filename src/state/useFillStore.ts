import { create } from 'zustand';
import { ServiceError, toServiceError } from '@/services/errors';
import {
  deleteAnswer,
  getFillData,
  getOrCreateDraft,
  reopenSubmission,
  saveAnswer,
  submitSubmission,
} from '@/services/submissionService';
import { deleteFiles, uploadAnswerFile } from '@/services/storageService';
import type { AnswerValue, FileUploadQuestion, FormDetail, PickedFile, Question, Submission } from '@/types/models';
import { getNextSection, getSectionPath, type NextStep } from '@/utils/branching';
import { checkUpload, type UploadError } from '@/utils/uploads';
import { registerStoreReset } from './storeRegistry';

/** How long answers wait for more typing before they are saved (about a second, like Google Forms). */
export const FILL_SAVE_DELAY_MS = 1000;

export type FillSaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

/** What happened to the files of one "attach" action. */
export interface AttachResult {
  added: number;
  /** The first file that was refused (and why); files after it were not uploaded. */
  refused?: { file: PickedFile; reason: UploadError };
}

interface FillState {
  /** Undefined while previewing a form that is not assigned to anyone. */
  assignmentId?: string;
  detail?: FormDetail;
  /** The user's response; created on the first saved answer. */
  submission?: Submission;
  answers: Record<string, AnswerValue>;
  currentSectionId?: string;
  /** Sections already passed, so "back" follows the branching the user took. */
  history: string[];
  /** Preview mode never saves anything. */
  isPreview: boolean;
  isLoading: boolean;
  /** i18n key of the last failed load. */
  errorKey?: string;
  saveState: FillSaveState;
  /** i18n key of the last failed save. */
  saveErrorKey?: string;
  /** False when the device has no connection: answers wait and submitting is disabled. */
  isOnline: boolean;
  isSubmitting: boolean;
  load: (assignmentId: string) => Promise<void>;
  /** Shows a form without saving, for the admin preview. */
  startPreview: (detail: FormDetail) => void;
  /** Applies the answer at once and saves it after a short pause; undefined clears it. */
  setAnswer: (question: Question, value: AnswerValue | undefined) => void;
  flush: () => Promise<void>;
  /** Uploads files for a file upload question after checking count, type and size, and adds them to the answer. */
  attachFiles: (question: FileUploadQuestion, files: PickedFile[], userId: string) => Promise<AttachResult>;
  /** Deletes an uploaded file and takes it out of the answer. */
  removeFile: (question: FileUploadQuestion, path: string) => Promise<void>;
  /** Moves to the next section following the branching; returns the step so the screen can submit at the end. */
  goNext: () => NextStep;
  goBack: () => void;
  submit: () => Promise<void>;
  reopen: () => Promise<void>;
  setOnline: (isOnline: boolean) => void;
  resetAll: () => void;
}

const initialState: Pick<
  FillState,
  | 'assignmentId'
  | 'detail'
  | 'submission'
  | 'answers'
  | 'currentSectionId'
  | 'history'
  | 'isPreview'
  | 'isLoading'
  | 'errorKey'
  | 'saveState'
  | 'saveErrorKey'
  | 'isSubmitting'
> = {
  assignmentId: undefined,
  detail: undefined,
  submission: undefined,
  answers: {},
  currentSectionId: undefined,
  history: [],
  isPreview: false,
  isLoading: false,
  errorKey: undefined,
  saveState: 'idle',
  saveErrorKey: undefined,
  isSubmitting: false,
};

export const useFillStore = create<FillState>((set, get) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** Answers waiting to be saved; `undefined` means the answer was cleared. */
  const pending = new Map<string, AnswerValue | undefined>();

  function firstSection(detail: FormDetail): string | undefined {
    return getSectionPath(detail.sections, detail.questions, {})[0];
  }

  /** The draft to save into; starts one on the first answer. */
  async function ensureDraft(assignmentId: string): Promise<Submission> {
    const current = get().submission;
    if (current?.status === 'draft') {
      return current;
    }
    const draft = await getOrCreateDraft(assignmentId);
    set({ submission: draft });
    return draft;
  }

  return {
    ...initialState,
    isOnline: true,

    load: async (assignmentId) => {
      clearTimeout(timer);
      pending.clear();
      set({ ...initialState, assignmentId, isLoading: true });
      try {
        const data = await getFillData(assignmentId);
        set({
          detail: data.detail,
          submission: data.submission,
          answers: data.answers,
          currentSectionId: firstSection(data.detail),
        });
      } catch (error) {
        set({ errorKey: toServiceError(error).messageKey });
      } finally {
        set({ isLoading: false });
      }
    },

    startPreview: (detail) => {
      clearTimeout(timer);
      pending.clear();
      set({ ...initialState, detail, isPreview: true, currentSectionId: firstSection(detail) });
    },

    setAnswer: (question, value) => {
      const answers = { ...get().answers };
      if (value === undefined) {
        delete answers[question.id];
      } else {
        answers[question.id] = value;
      }
      set({ answers });
      if (get().isPreview) {
        return;
      }
      pending.set(question.id, value);
      set({ saveState: 'dirty' });
      clearTimeout(timer);
      timer = setTimeout(() => void get().flush(), FILL_SAVE_DELAY_MS);
    },

    flush: async () => {
      clearTimeout(timer);
      const { assignmentId, isPreview, isOnline } = get();
      if (isPreview || assignmentId === undefined || pending.size === 0) {
        return;
      }
      if (!isOnline) {
        set({ saveState: 'dirty' });
        return;
      }

      const batch = [...pending.entries()];
      pending.clear();
      set({ saveState: 'saving', saveErrorKey: undefined });
      try {
        const draft = await ensureDraft(assignmentId);
        await Promise.all(
          batch.map(([questionId, value]) =>
            value === undefined ? deleteAnswer(draft.id, questionId) : saveAnswer(draft.id, questionId, value),
          ),
        );
        set({ saveState: pending.size > 0 ? 'dirty' : 'saved' });
      } catch (error) {
        // Keep the answers for a retry; answers given meanwhile are newer and win.
        batch.forEach(([questionId, value]) => {
          if (!pending.has(questionId)) pending.set(questionId, value);
        });
        set({ saveState: 'error', saveErrorKey: toServiceError(error).messageKey });
      }
    },

    attachFiles: async (question, files, userId) => {
      const { assignmentId, isOnline } = get();
      if (assignmentId === undefined) {
        return { added: 0 };
      }
      if (!isOnline) {
        throw new ServiceError('network');
      }
      const draft = await ensureDraft(assignmentId);
      const current = get().answers[question.id];
      const paths = Array.isArray(current) ? [...current] : [];
      let added = 0;

      for (const file of files) {
        const reason = checkUpload(file, paths.length, question.settings);
        if (reason !== undefined) {
          if (added > 0) get().setAnswer(question, paths);
          return { added, refused: { file, reason } };
        }
        paths.push(await uploadAnswerFile(userId, draft.id, question.id, file));
        added += 1;
      }
      if (added > 0) get().setAnswer(question, paths);
      return { added };
    },

    removeFile: async (question, path) => {
      const current = get().answers[question.id];
      const remaining = Array.isArray(current) ? current.filter((item) => item !== path) : [];
      await deleteFiles('form-uploads', [path]);
      get().setAnswer(question, remaining.length === 0 ? undefined : remaining);
    },

    goNext: () => {
      const { detail, currentSectionId, answers, history } = get();
      if (detail === undefined || currentSectionId === undefined) {
        return { kind: 'submit' };
      }
      const step = getNextSection(detail.sections, detail.questions, answers, currentSectionId);
      if (step.kind === 'section') {
        set({ history: [...history, currentSectionId], currentSectionId: step.sectionId });
      }
      return step;
    },

    goBack: () => {
      const { history } = get();
      const previous = history[history.length - 1];
      if (previous !== undefined) {
        set({ currentSectionId: previous, history: history.slice(0, -1) });
      }
    },

    submit: async () => {
      const { isPreview, isOnline, assignmentId } = get();
      if (isPreview || assignmentId === undefined) {
        return;
      }
      if (!isOnline) {
        throw new ServiceError('network');
      }
      set({ isSubmitting: true });
      try {
        await get().flush();
        if (get().saveState === 'error' || pending.size > 0) {
          throw new ServiceError('unknown');
        }
        const draft = await ensureDraft(assignmentId);
        set({ submission: await submitSubmission(draft.id), saveState: 'idle' });
      } finally {
        set({ isSubmitting: false });
      }
    },

    reopen: async () => {
      const { submission } = get();
      if (submission === undefined) {
        return;
      }
      const draft = await reopenSubmission(submission.id);
      const { detail } = get();
      set({
        submission: draft,
        history: [],
        saveState: 'idle',
        currentSectionId: detail === undefined ? undefined : firstSection(detail),
      });
    },

    setOnline: (isOnline) => {
      set({ isOnline });
      if (isOnline && pending.size > 0) {
        void get().flush();
      }
    },

    resetAll: () => {
      clearTimeout(timer);
      pending.clear();
      set({ ...initialState, isOnline: true });
    },
  };
});

registerStoreReset(() => useFillStore.getState().resetAll());
