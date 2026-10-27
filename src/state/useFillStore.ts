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
import type { AnswerValue, FormDetail, Question, Submission } from '@/types/models';
import { getNextSection, getSectionPath, type NextStep } from '@/utils/branching';
import { registerStoreReset } from './storeRegistry';

/** How long answers wait for more typing before they are saved (about a second, like Google Forms). */
export const FILL_SAVE_DELAY_MS = 1000;

export type FillSaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

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
