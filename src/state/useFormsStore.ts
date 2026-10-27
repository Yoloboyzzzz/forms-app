import { create } from 'zustand';
import {
  archiveForm,
  createForm,
  deleteForm,
  duplicateForm,
  listForms,
} from '@/services/formService';
import { toServiceError } from '@/services/errors';
import type { Form } from '@/types/models';
import { registerStoreReset } from './storeRegistry';

interface FormsState {
  /** All forms, newest change first. Filtering by status happens in the UI. */
  forms: Form[];
  isLoaded: boolean;
  isLoading: boolean;
  /** i18n key of the last failed load. */
  errorKey?: string;
  load: () => Promise<void>;
  create: (draft: { title: string; description?: string }, createdBy: string) => Promise<Form>;
  archive: (formId: string) => Promise<void>;
  duplicate: (formId: string, title: string, createdBy: string) => Promise<Form>;
  remove: (formId: string) => Promise<void>;
  resetAll: () => void;
}

const initialState: Pick<FormsState, 'forms' | 'isLoaded' | 'isLoading' | 'errorKey'> = {
  forms: [],
  isLoaded: false,
  isLoading: false,
  errorKey: undefined,
};

function replaceForm(forms: Form[], updated: Form): Form[] {
  return forms.map((form) => (form.id === updated.id ? updated : form));
}

export const useFormsStore = create<FormsState>((set, get) => ({
  ...initialState,

  load: async () => {
    set({ isLoading: true, errorKey: undefined });
    try {
      set({ forms: await listForms(), isLoaded: true });
    } catch (error) {
      set({ errorKey: toServiceError(error).messageKey });
    } finally {
      set({ isLoading: false });
    }
  },

  create: async (draft, createdBy) => {
    const form = await createForm(draft, createdBy);
    set({ forms: [form, ...get().forms] });
    return form;
  },

  archive: async (formId) => {
    const updated = await archiveForm(formId);
    set({ forms: replaceForm(get().forms, updated) });
  },

  duplicate: async (formId, title, createdBy) => {
    const copy = await duplicateForm(formId, title, createdBy);
    set({ forms: [copy, ...get().forms] });
    return copy;
  },

  remove: async (formId) => {
    await deleteForm(formId);
    set({ forms: get().forms.filter((form) => form.id !== formId) });
  },

  resetAll: () => set({ ...initialState }),
}));

registerStoreReset(() => useFormsStore.getState().resetAll());
