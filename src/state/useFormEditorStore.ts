import { create } from 'zustand';
import { ServiceError, toServiceError } from '@/services/errors';
import { archiveForm, getFormDetail, publishForm, updateForm as updateFormService } from '@/services/formService';
import type { FormPatch, SectionPatch } from '@/services/mappers/recordMappers';
import {
  addQuestion as addQuestionService,
  duplicateQuestion as duplicateQuestionService,
  removeQuestion as removeQuestionService,
  reorderQuestions,
  updateQuestion as updateQuestionService,
} from '@/services/questionService';
import {
  addSection as addSectionService,
  deleteSection,
  reorderSections,
  updateSection as updateSectionService,
} from '@/services/sectionService';
import type { QuestionType } from '@/types/enums';
import type { FormDetail, FormSection, Question } from '@/types/models';
import { moveItem, withOrderIndexes, type MoveDirection } from '@/utils/ordering';
import {
  createDefaultQuestion,
  questionsOfSection,
  sortedSections,
  toQuestionDraft,
} from '@/utils/questions';
import { registerStoreReset } from './storeRegistry';

/** How long edits wait for more typing before they are saved. */
export const SAVE_DELAY_MS = 800;

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

/** Translated defaults for a new question; ids come from the caller so the store stays free of platform code. */
export interface NewQuestionDefaults {
  title: string;
  newId: () => string;
  optionLabel: (position: number) => string;
}

interface FormEditorState {
  /** The form being edited, shared by the editor, settings and preview screens. */
  detail?: FormDetail;
  isLoading: boolean;
  /** i18n key of the last failed load. */
  errorKey?: string;
  saveState: SaveState;
  /** i18n key of the last failed save. */
  saveErrorKey?: string;
  load: (formId: string) => Promise<void>;
  /** Applies the change at once and saves it after a short pause. */
  updateForm: (patch: FormPatch) => void;
  /** Applies the change at once and saves it after a short pause. */
  updateQuestion: (question: Question) => void;
  /** Saves pending edits now (before leaving the screen, publishing, retrying after an error). */
  flush: () => Promise<void>;
  addSection: (title?: string) => Promise<FormSection>;
  updateSection: (sectionId: string, patch: SectionPatch) => Promise<void>;
  moveSection: (sectionId: string, direction: MoveDirection) => Promise<void>;
  removeSection: (sectionId: string) => Promise<void>;
  addQuestion: (sectionId: string, questionType: QuestionType, defaults: NewQuestionDefaults) => Promise<Question>;
  moveQuestion: (questionId: string, direction: MoveDirection) => Promise<void>;
  duplicateQuestion: (questionId: string) => Promise<void>;
  removeQuestion: (questionId: string) => Promise<'deleted' | 'deactivated'>;
  publish: () => Promise<void>;
  archive: () => Promise<void>;
  resetAll: () => void;
}

const initialState: Pick<FormEditorState, 'detail' | 'isLoading' | 'errorKey' | 'saveState' | 'saveErrorKey'> = {
  detail: undefined,
  isLoading: false,
  errorKey: undefined,
  saveState: 'idle',
  saveErrorKey: undefined,
};

export const useFormEditorStore = create<FormEditorState>((set, get) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const pendingQuestions = new Map<string, Question>();
  let pendingForm: FormPatch = {};

  function requireDetail(): FormDetail {
    const { detail } = get();
    if (detail === undefined) {
      throw new ServiceError('notFound');
    }
    return detail;
  }

  function schedule(): void {
    set({ saveState: 'dirty' });
    clearTimeout(timer);
    timer = setTimeout(() => void get().flush(), SAVE_DELAY_MS);
  }

  function setQuestions(update: (questions: Question[]) => Question[]): void {
    const detail = requireDetail();
    set({ detail: { ...detail, questions: update(detail.questions) } });
  }

  function setSections(update: (sections: FormSection[]) => FormSection[]): void {
    const detail = requireDetail();
    set({ detail: { ...detail, sections: update(detail.sections) } });
  }

  /** Runs a structural change; restores the previous editor state when saving it fails. */
  async function withRollback<T>(action: () => Promise<T>): Promise<T> {
    const before = get().detail;
    try {
      return await action();
    } catch (error) {
      set({ detail: before });
      throw error;
    }
  }

  return {
    ...initialState,

    load: async (formId) => {
      set({ ...initialState, isLoading: true });
      pendingQuestions.clear();
      pendingForm = {};
      clearTimeout(timer);
      try {
        set({ detail: await getFormDetail(formId) });
      } catch (error) {
        set({ errorKey: toServiceError(error).messageKey });
      } finally {
        set({ isLoading: false });
      }
    },

    updateForm: (patch) => {
      const detail = requireDetail();
      set({ detail: { ...detail, form: { ...detail.form, ...patch } } });
      pendingForm = { ...pendingForm, ...patch };
      schedule();
    },

    updateQuestion: (question) => {
      setQuestions((questions) => questions.map((item) => (item.id === question.id ? question : item)));
      pendingQuestions.set(question.id, question);
      schedule();
    },

    flush: async () => {
      clearTimeout(timer);
      const questions = [...pendingQuestions.values()];
      const formPatch = pendingForm;
      const hasFormPatch = Object.keys(formPatch).length > 0;
      const detail = get().detail;
      pendingQuestions.clear();
      pendingForm = {};
      if (detail === undefined || (questions.length === 0 && !hasFormPatch)) {
        return;
      }

      set({ saveState: 'saving', saveErrorKey: undefined });
      try {
        await Promise.all([
          ...questions.map((question) => updateQuestionService(question.id, toQuestionDraft(question))),
          hasFormPatch ? updateFormService(detail.form.id, formPatch) : Promise.resolve(),
        ]);
        set({ saveState: pendingQuestions.size > 0 || Object.keys(pendingForm).length > 0 ? 'dirty' : 'saved' });
      } catch (error) {
        // Keep the edits so "retry" can save them; newer edits to the same item win.
        questions.forEach((question) => {
          if (!pendingQuestions.has(question.id)) pendingQuestions.set(question.id, question);
        });
        pendingForm = { ...formPatch, ...pendingForm };
        set({ saveState: 'error', saveErrorKey: toServiceError(error).messageKey });
      }
    },

    addSection: async (title) => {
      const detail = requireDetail();
      const section = await addSectionService({
        formId: detail.form.id,
        title,
        orderIndex: detail.sections.length,
        afterAction: 'next',
      });
      setSections((sections) => [...sections, section]);
      return section;
    },

    updateSection: async (sectionId, patch) => {
      requireDetail();
      const updated = await updateSectionService(sectionId, patch);
      setSections((sections) => sections.map((section) => (section.id === sectionId ? updated : section)));
    },

    moveSection: async (sectionId, direction) => {
      const ordered = sortedSections(requireDetail());
      const reordered = moveItem(ordered, sectionId, direction);
      if (reordered === ordered) return;
      const moved = withOrderIndexes(reordered);
      await withRollback(async () => {
        setSections(() => moved);
        await reorderSections(moved.map((section) => section.id));
      });
    },

    removeSection: async (sectionId) => {
      const detail = requireDetail();
      if (detail.sections.length <= 1) {
        throw new ServiceError('invalidInput');
      }
      await deleteSection(sectionId);
      const remaining = withOrderIndexes(sortedSections(detail).filter((section) => section.id !== sectionId));
      // The database clears jumps to the deleted section; mirror that, and continue normally instead.
      const needsReset = remaining.filter((section) => section.goToSectionId === sectionId);
      set({
        detail: {
          ...detail,
          sections: remaining.map((section) =>
            section.goToSectionId === sectionId
              ? { ...section, afterAction: 'next', goToSectionId: undefined }
              : section,
          ),
          questions: detail.questions.filter((question) => question.sectionId !== sectionId),
        },
      });
      await Promise.all(
        needsReset.map((section) => updateSectionService(section.id, { afterAction: 'next', goToSectionId: undefined })),
      );
      await reorderSections(remaining.map((section) => section.id));
    },

    addQuestion: async (sectionId, questionType, defaults) => {
      const detail = requireDetail();
      const draft = createDefaultQuestion({
        questionType,
        formId: detail.form.id,
        sectionId,
        orderIndex: questionsOfSection(detail, sectionId).length,
        ...defaults,
      });
      const question = await addQuestionService(draft);
      setQuestions((questions) => [...questions, question]);
      return question;
    },

    moveQuestion: async (questionId, direction) => {
      const detail = requireDetail();
      const question = detail.questions.find((item) => item.id === questionId);
      if (question === undefined) return;
      const ordered = questionsOfSection(detail, question.sectionId);
      const reordered = moveItem(ordered, questionId, direction);
      if (reordered === ordered) return;
      const moved = withOrderIndexes(reordered);
      await withRollback(async () => {
        setQuestions((questions) => [
          ...questions.filter((item) => item.sectionId !== question.sectionId),
          ...moved,
        ]);
        await reorderQuestions(moved.map((item) => item.id));
      });
    },

    duplicateQuestion: async (questionId) => {
      const detail = requireDetail();
      const question = detail.questions.find((item) => item.id === questionId);
      if (question === undefined) return;
      const copy = await duplicateQuestionService(question);
      const siblings = questionsOfSection(detail, question.sectionId);
      const position = siblings.findIndex((item) => item.id === questionId) + 1;
      const reordered = withOrderIndexes([...siblings.slice(0, position), copy, ...siblings.slice(position)]);
      setQuestions((questions) => [...questions.filter((item) => item.sectionId !== question.sectionId), ...reordered]);
      await reorderQuestions(reordered.map((item) => item.id));
    },

    removeQuestion: async (questionId) => {
      const detail = requireDetail();
      const outcome = await removeQuestionService(questionId);
      pendingQuestions.delete(questionId);
      if (outcome === 'deleted') {
        const removed = detail.questions.find((item) => item.id === questionId);
        const remaining = detail.questions.filter((item) => item.id !== questionId);
        const siblings = withOrderIndexes(
          removed === undefined ? [] : questionsOfSection({ ...detail, questions: remaining }, removed.sectionId),
        );
        set({
          detail: {
            ...detail,
            questions: [...remaining.filter((item) => item.sectionId !== removed?.sectionId), ...siblings],
          },
        });
      } else {
        setQuestions((questions) =>
          questions.map((item) => (item.id === questionId ? { ...item, isActive: false } : item)),
        );
      }
      return outcome;
    },

    publish: async () => {
      const detail = requireDetail();
      await get().flush();
      if (get().saveState === 'error') {
        throw new ServiceError('unknown');
      }
      const form = await publishForm(detail.form.id);
      set({ detail: { ...requireDetail(), form } });
    },

    archive: async () => {
      const detail = requireDetail();
      await get().flush();
      const form = await archiveForm(detail.form.id);
      set({ detail: { ...requireDetail(), form } });
    },

    resetAll: () => {
      clearTimeout(timer);
      pendingQuestions.clear();
      pendingForm = {};
      set({ ...initialState });
    },
  };
});

registerStoreReset(() => useFormEditorStore.getState().resetAll());
