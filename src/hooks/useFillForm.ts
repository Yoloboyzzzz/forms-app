import type { TFunction } from 'i18next';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ServiceError, toServiceError } from '@/services/errors';
import type { FileUploadControls } from '@/components/QuestionRenderer';
import { useAuthStore } from '@/state/useAuthStore';
import { useFillStore, type FillSaveState } from '@/state/useFillStore';
import type { AnswerValue, FileUploadQuestion, Form, FormDetail, FormSection, Question } from '@/types/models';
import { getSectionErrors, type AnswerError } from '@/utils/answers';
import { getNextSection, getSectionPath } from '@/utils/branching';
import { isFormOpen } from '@/utils/formAvailability';
import { questionsOfSection } from '@/utils/questions';
import { seedFrom, shuffleWithSeed } from '@/utils/shuffle';
import { DEFAULT_MAX_FILES, DEFAULT_MAX_FILE_SIZE_MB, type UploadError } from '@/utils/uploads';
import { useIsOnline } from './useIsOnline';
import { usePickFiles } from './usePickFiles';

/** What the screen fills in: an assignment of the signed-in user, or an unsaved admin preview of a form. */
export type FillSource = { assignmentId: string } | { preview: FormDetail };

interface UseFillForm {
  isLoading: boolean;
  errorKey?: string;
  reload: () => void;
  form?: Form;
  section?: FormSection;
  /** The questions of the current section in the order they are shown. */
  questions: Question[];
  answers: Record<string, AnswerValue>;
  setAnswer: (question: Question, value: AnswerValue | undefined) => void;
  /** Translated errors by question id; shown after "next" or "submit" was pressed with problems. */
  errors: Record<string, string>;
  /** 1-based position on the path the answers lead to, for "Section 2 of 3". */
  position: { current: number; total: number };
  /** True when the form is closed and the user has not answered yet. */
  isClosed: boolean;
  isPreview: boolean;
  canGoBack: boolean;
  isLastSection: boolean;
  next: () => void;
  back: () => void;
  saveState: FillSaveState;
  saveErrorKey?: string;
  retrySave: () => void;
  isOnline: boolean;
  isSubmitting: boolean;
  /** True while the "submit this form?" confirmation is open. */
  isConfirming: boolean;
  confirmSubmit: () => Promise<void>;
  cancelSubmit: () => void;
  /** i18n key when submitting failed. */
  submitErrorKey?: string;
  isSubmitted: boolean;
  /** True once the preview reached the end of the form. */
  previewFinished: boolean;
  fileUpload: FileUploadControls;
}

function translateError(error: AnswerError, t: TFunction): string {
  if (error.kind === 'required') {
    return t('fill.required');
  }
  if (error.kind === 'grid') {
    return t(error.reason === 'eachRow' ? 'fill.gridEachRow' : 'fill.gridOnePerColumn');
  }
  return error.failure.customMessage ?? t(error.failure.defaultKey, error.failure.params);
}

/** Glue for the fill-in screen (and the admin preview): loading, sections, validation, autosave and submitting. */
export function useFillForm(source: FillSource): UseFillForm {
  const { t } = useTranslation();
  const store = useFillStore.getState;
  const detail = useFillStore((state) => state.detail);
  const answers = useFillStore((state) => state.answers);
  const submission = useFillStore((state) => state.submission);
  const currentSectionId = useFillStore((state) => state.currentSectionId);
  const history = useFillStore((state) => state.history);
  const isLoading = useFillStore((state) => state.isLoading);
  const errorKey = useFillStore((state) => state.errorKey);
  const saveState = useFillStore((state) => state.saveState);
  const saveErrorKey = useFillStore((state) => state.saveErrorKey);
  const isSubmitting = useFillStore((state) => state.isSubmitting);
  const isPreview = useFillStore((state) => state.isPreview);
  const isOnline = useIsOnline();
  const pickFiles = usePickFiles();
  const userId = useAuthStore((state) => state.session?.userId);

  const [rawErrors, setRawErrors] = useState<Record<string, AnswerError>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [submitErrorKey, setSubmitErrorKey] = useState<string | undefined>(undefined);
  const [previewFinished, setPreviewFinished] = useState(false);
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | undefined>(undefined);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const assignmentId = 'assignmentId' in source ? source.assignmentId : undefined;
  const preview = 'preview' in source ? source.preview : undefined;

  useEffect(() => {
    if (assignmentId !== undefined) void store().load(assignmentId);
    else if (preview !== undefined) store().startPreview(preview);
    return () => {
      // Leaving the screen must not lose the last answers.
      void store().flush();
    };
  }, [assignmentId, preview, store]);

  useEffect(() => {
    store().setOnline(isOnline);
  }, [isOnline, store]);

  const section = detail?.sections.find((item) => item.id === currentSectionId);
  const sectionId = section?.id;

  // Errors stay in sync with the answers once shown, so they disappear as soon as the problem is fixed.
  useEffect(() => {
    if (showErrors && detail !== undefined && sectionId !== undefined) {
      setRawErrors(getSectionErrors(detail.questions, sectionId, answers));
    }
  }, [showErrors, detail, sectionId, answers]);

  let questions: Question[] = [];
  if (detail !== undefined && section !== undefined) {
    const inSection = questionsOfSection(detail, section.id);
    questions = detail.form.shuffleQuestionOrder
      ? shuffleWithSeed(inSection, seedFrom(`${assignmentId ?? 'preview'}-${section.id}`))
      : inSection;
  }

  const path = detail === undefined ? [] : getSectionPath(detail.sections, detail.questions, answers);
  const index = sectionId === undefined ? -1 : path.indexOf(sectionId);
  const isLastSection =
    detail !== undefined &&
    sectionId !== undefined &&
    getNextSection(detail.sections, detail.questions, answers, sectionId).kind === 'submit';

  const errors: Record<string, string> = {};
  if (showErrors) {
    for (const [questionId, error] of Object.entries(rawErrors)) errors[questionId] = translateError(error, t);
  }

  function uploadMessage(question: FileUploadQuestion, reason: UploadError): string {
    const { settings } = question;
    if (reason === 'tooLarge') return t('fill.upload.tooLarge', { mb: settings.maxFileSizeMb ?? DEFAULT_MAX_FILE_SIZE_MB });
    if (reason === 'tooMany') return t('fill.upload.tooMany', { count: settings.maxFiles ?? DEFAULT_MAX_FILES });
    return t('fill.upload.wrongType', { types: (settings.allowedTypes ?? []).join(', ') });
  }

  function setUploadError(questionId: string, message: string | undefined): void {
    setUploadErrors((current) => {
      const { [questionId]: _removed, ...rest } = current;
      return message === undefined ? rest : { ...rest, [questionId]: message };
    });
  }

  async function pickAndUpload(question: FileUploadQuestion): Promise<void> {
    if (userId === undefined || isPreview) return;
    setUploadError(question.id, undefined);
    const maxFiles = question.settings.maxFiles ?? DEFAULT_MAX_FILES;
    const files = await pickFiles({ types: question.settings.allowedTypes, multiple: maxFiles > 1 });
    if (files.length === 0) return;
    setUploadingQuestionId(question.id);
    try {
      const result = await store().attachFiles(question, files, userId);
      if (result.refused !== undefined) setUploadError(question.id, uploadMessage(question, result.refused.reason));
    } catch (error) {
      setUploadError(question.id, error instanceof ServiceError ? t(error.messageKey) : t('fill.upload.failed'));
    } finally {
      setUploadingQuestionId(undefined);
    }
  }

  function next(): void {
    if (detail === undefined || sectionId === undefined) return;
    const found = getSectionErrors(detail.questions, sectionId, answers);
    setRawErrors(found);
    setSubmitErrorKey(undefined);
    if (Object.keys(found).length > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (isLastSection) {
      if (isPreview) setPreviewFinished(true);
      else setIsConfirming(true);
    } else {
      store().goNext();
    }
  }

  return {
    isLoading,
    errorKey,
    reload: () => {
      if (assignmentId !== undefined) void store().load(assignmentId);
    },
    form: detail?.form,
    section,
    questions,
    answers,
    setAnswer: (question, value) => store().setAnswer(question, value),
    errors,
    position: { current: Math.max(index, 0) + 1, total: Math.max(path.length, 1) },
    isClosed: detail !== undefined && !isPreview && submission === undefined && !isFormOpen(detail.form, new Date()),
    isPreview,
    canGoBack: history.length > 0,
    isLastSection,
    next,
    back: () => {
      setShowErrors(false);
      setRawErrors({});
      setPreviewFinished(false);
      store().goBack();
    },
    saveState,
    saveErrorKey,
    retrySave: () => void store().flush(),
    isOnline,
    isSubmitting,
    isConfirming,
    confirmSubmit: async () => {
      try {
        await store().submit();
        setIsConfirming(false);
      } catch (error) {
        setIsConfirming(false);
        setSubmitErrorKey(toServiceError(error).messageKey);
      }
    },
    cancelSubmit: () => setIsConfirming(false),
    submitErrorKey,
    isSubmitted: submission?.status === 'submitted',
    previewFinished,
    fileUpload: {
      onPick: (question) => void pickAndUpload(question),
      onRemove: (question, path) => {
        setUploadError(question.id, undefined);
        void store()
          .removeFile(question, path)
          .catch((error: unknown) => setUploadError(question.id, t(toServiceError(error).messageKey)));
      },
      uploadingQuestionId,
      errors: uploadErrors,
    },
  };
}
