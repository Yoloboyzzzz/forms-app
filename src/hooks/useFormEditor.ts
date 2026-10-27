import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestionImageControls } from '@/components/QuestionImageEditor';
import type { QuestionHandlers, SectionHandlers } from '@/components/SectionEditor';
import { ServiceError, toServiceError } from '@/services/errors';
import type { FormPatch } from '@/services/mappers/recordMappers';
import { useAuthStore } from '@/state/useAuthStore';
import { useFormEditorStore } from '@/state/useFormEditorStore';
import { useFormsStore } from '@/state/useFormsStore';
import type { QuestionType } from '@/types/enums';
import type { FormDetail, FormSection, Question } from '@/types/models';
import { useSignedUrls } from './useSignedUrls';
import { usePickFiles } from './usePickFiles';
import type { SaveState } from '@/state/useFormEditorStore';

const MESSAGE_DURATION_MS = 4000;

export type FormAction = 'publish' | 'archive' | 'duplicate';

interface UseFormEditorOptions {
  /** Called with the id of the new draft after a form was duplicated. */
  onDuplicated?: (formId: string) => void;
}

interface UseFormEditor {
  detail?: FormDetail;
  isLoading: boolean;
  errorKey?: string;
  reload: () => void;
  saveState: SaveState;
  saveErrorKey?: string;
  retrySave: () => void;
  changeForm: (patch: FormPatch) => void;
  questionHandlers: QuestionHandlers;
  sectionHandlers: SectionHandlers;
  imageControls: QuestionImageControls;
  addSection: () => Promise<void>;
  sectionToDelete?: FormSection;
  cancelDeleteSection: () => void;
  confirmDeleteSection: () => Promise<void>;
  /** Section the question type picker is open for. */
  pickerSectionId?: string;
  openPicker: (sectionId: string) => void;
  closePicker: () => void;
  addQuestion: (type: QuestionType) => Promise<void>;
  deleteTarget?: Question;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
  isWorking: boolean;
  /** i18n key of the last failed action. */
  actionErrorKey?: string;
  /** i18n key of an informational message (for example "question was deactivated"). */
  noticeKey?: string;
  noticeVariant: 'default' | 'success';
  /** The publish, archive or duplicate action waiting for confirmation. */
  pendingAction?: FormAction;
  requestAction: (action: FormAction) => void;
  cancelAction: () => void;
  confirmAction: () => Promise<void>;
  dismissMessages: () => void;
}

/** Glue for the form editor screen: loads the form, autosaves on leave and runs structural edits with feedback. */
export function useFormEditor(formId: string, options: UseFormEditorOptions = {}): UseFormEditor {
  const { t } = useTranslation();
  const detail = useFormEditorStore((state) => state.detail);
  const isLoading = useFormEditorStore((state) => state.isLoading);
  const errorKey = useFormEditorStore((state) => state.errorKey);
  const saveState = useFormEditorStore((state) => state.saveState);
  const saveErrorKey = useFormEditorStore((state) => state.saveErrorKey);
  const store = useFormEditorStore.getState;
  const pickFiles = usePickFiles();
  const duplicateForm = useFormsStore((state) => state.duplicate);
  const userId = useAuthStore((state) => state.session?.userId);

  const [pickerSectionId, setPickerSectionId] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Question | undefined>(undefined);
  const [sectionToDelete, setSectionToDelete] = useState<FormSection | undefined>(undefined);
  const [isWorking, setIsWorking] = useState(false);
  const [actionErrorKey, setActionErrorKey] = useState<string | undefined>(undefined);
  const [noticeKey, setNoticeKey] = useState<string | undefined>(undefined);
  const [noticeVariant, setNoticeVariant] = useState<'default' | 'success'>('default');
  const [pendingAction, setPendingAction] = useState<FormAction | undefined>(undefined);
  const [imageBusyId, setImageBusyId] = useState<string | undefined>(undefined);
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});
  const imageUrls = useSignedUrls(
    'form-media',
    (detail?.questions ?? []).flatMap((question) => (question.imagePath === undefined ? [] : [question.imagePath])),
  );

  useEffect(() => {
    void store().open(formId);
    // Leaving the screen must not lose the last edits.
    return () => {
      void store().flush();
    };
  }, [formId, store]);

  // Messages disappear on their own so they do not pile up over the editor.
  useEffect(() => {
    if (actionErrorKey === undefined && noticeKey === undefined) return undefined;
    const timeout = setTimeout(() => {
      setActionErrorKey(undefined);
      setNoticeKey(undefined);
    }, MESSAGE_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [actionErrorKey, noticeKey]);

  async function changeImage(question: Question, action: () => Promise<void>): Promise<void> {
    setImageErrors(({ [question.id]: _removed, ...rest }) => rest);
    setImageBusyId(question.id);
    try {
      await action();
    } catch (error) {
      const service = toServiceError(error);
      const message = service.code === 'invalidInput' ? t('editor.image.invalid') : t(service.messageKey);
      setImageErrors((current) => ({ ...current, [question.id]: message }));
    } finally {
      setImageBusyId(undefined);
    }
  }

  async function run(action: () => Promise<void>): Promise<void> {
    setActionErrorKey(undefined);
    setNoticeKey(undefined);
    setIsWorking(true);
    try {
      await action();
    } catch (error) {
      setActionErrorKey(toServiceError(error).messageKey);
    } finally {
      setIsWorking(false);
    }
  }

  return {
    detail,
    isLoading,
    errorKey,
    reload: () => void store().load(formId),
    saveState,
    saveErrorKey,
    retrySave: () => void store().flush(),
    changeForm: (patch) => store().updateForm(patch),
    questionHandlers: {
      onChange: (question) => store().updateQuestion(question),
      onMove: (questionId, direction) => void run(() => store().moveQuestion(questionId, direction)),
      onDuplicate: (questionId) => void run(() => store().duplicateQuestion(questionId)),
      onDelete: setDeleteTarget,
    },
    imageControls: {
      urls: imageUrls,
      busyQuestionId: imageBusyId,
      errors: imageErrors,
      onPick: (question) =>
        void pickFiles({ types: ['image/*'] }).then(([file]) => {
          if (file !== undefined) return changeImage(question, () => store().attachImage(question.id, file));
          return undefined;
        }),
      onRemove: (question) => void changeImage(question, () => store().removeImage(question.id)),
    },
    sectionHandlers: {
      onEdit: (sectionId, patch) => store().editSection(sectionId, patch),
      onChangeAfter: (sectionId, patch) => void run(() => store().updateSection(sectionId, patch)),
      onMove: (sectionId, direction) => void run(() => store().moveSection(sectionId, direction)),
      onDelete: setSectionToDelete,
    },
    addSection: () =>
      run(async () => {
        await store().addSection();
      }),
    sectionToDelete,
    cancelDeleteSection: () => setSectionToDelete(undefined),
    confirmDeleteSection: async () => {
      const target = sectionToDelete;
      setSectionToDelete(undefined);
      if (target === undefined) return;
      await run(() => store().removeSection(target.id));
    },
    pickerSectionId,
    openPicker: setPickerSectionId,
    closePicker: () => setPickerSectionId(undefined),
    addQuestion: async (type) => {
      const sectionId = pickerSectionId;
      setPickerSectionId(undefined);
      if (sectionId === undefined) return;
      await run(async () => {
        await store().addQuestion(sectionId, type, {
          title: t('editor.newQuestionTitle'),
          newId: () => Crypto.randomUUID(),
          optionLabel: (n) => t('editor.optionLabel', { n }),
        });
      });
    },
    deleteTarget,
    cancelDelete: () => setDeleteTarget(undefined),
    confirmDelete: async () => {
      const target = deleteTarget;
      setDeleteTarget(undefined);
      if (target === undefined) return;
      await run(async () => {
        const outcome = await store().removeQuestion(target.id);
        if (outcome === 'deactivated') {
          setNoticeVariant('default');
          setNoticeKey('editor.deactivatedNotice');
        }
      });
    },
    isWorking,
    actionErrorKey,
    noticeKey,
    noticeVariant,
    pendingAction,
    requestAction: setPendingAction,
    cancelAction: () => setPendingAction(undefined),
    confirmAction: async () => {
      const action = pendingAction;
      setPendingAction(undefined);
      const current = store().detail;
      if (action === undefined || current === undefined) return;
      await run(async () => {
        try {
          if (action === 'publish') {
            await store().publish();
            setNoticeKey('editor.published');
          } else if (action === 'archive') {
            await store().archive();
            setNoticeKey('editor.archived');
          } else if (userId !== undefined) {
            await store().flush();
            const copy = await duplicateForm(current.form.id, t('editor.copyTitle', { title: current.form.title }), userId);
            setNoticeKey('editor.duplicated');
            options.onDuplicated?.(copy.id);
          }
          setNoticeVariant('success');
        } catch (error) {
          // A form without any active question cannot be published; say so in plain words.
          if (action === 'publish' && error instanceof ServiceError && error.code === 'invalidInput') {
            setActionErrorKey('editor.publishNeedsQuestion');
            return;
          }
          throw error;
        }
      });
    },
    dismissMessages: () => {
      setActionErrorKey(undefined);
      setNoticeKey(undefined);
    },
  };
}
