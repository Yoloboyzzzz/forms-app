import { useTranslation } from 'react-i18next';
import { testIds } from '@/constants/testIds';
import type { FillSaveState } from '@/state/useFillStore';
import type { AnswerValue, Form, FormSection, Question } from '@/types/models';
import { ProgressHeader } from './ProgressHeader';
import { QuestionRenderer, type FileUploadControls } from './QuestionRenderer';
import { Button, ConfirmDialog, Icon, OfflineBanner, Row, Stack, Text } from './primitives';

interface FormFillViewProps {
  form: Form;
  section: FormSection;
  questions: Question[];
  answers: Record<string, AnswerValue>;
  onChangeAnswer: (question: Question, value: AnswerValue | undefined) => void;
  /** Translated errors by question id. */
  errors: Record<string, string>;
  position: { current: number; total: number };
  canGoBack: boolean;
  isLastSection: boolean;
  onNext: () => void;
  onBack: () => void;
  isPreview?: boolean;
  isOnline?: boolean;
  isSubmitting?: boolean;
  saveState?: FillSaveState;
  saveErrorKey?: string;
  onRetrySave?: () => void;
  isConfirming?: boolean;
  onConfirmSubmit: () => void;
  onCancelSubmit: () => void;
  /** i18n key when submitting failed. */
  submitErrorKey?: string;
  fileUpload?: FileUploadControls;
  /** Temporary image links by storage path. */
  imageUrls?: Record<string, string>;
}

/** One section of a form: progress, its questions and back/next/submit. */
export function FormFillView({
  form,
  section,
  questions,
  answers,
  onChangeAnswer,
  errors,
  position,
  canGoBack,
  isLastSection,
  onNext,
  onBack,
  isPreview = false,
  isOnline = true,
  isSubmitting = false,
  saveState,
  saveErrorKey,
  onRetrySave,
  isConfirming = false,
  onConfirmSubmit,
  onCancelSubmit,
  submitErrorKey,
  fileUpload,
  imageUrls = {},
}: FormFillViewProps) {
  const { t } = useTranslation();
  const canSubmit = isOnline || isPreview;

  return (
    <Stack gap="lg" testID={testIds.fill.screen}>
      {isPreview && (
        <Row gap="sm" testID={testIds.fill.previewBanner}>
          <Icon name="eye" size={18} color="warning" />
          <Text color="warning" weight="medium">{t('fill.previewBanner')}</Text>
        </Row>
      )}
      <OfflineBanner visible={!isOnline && !isPreview} message={t('fill.offline')} testID={testIds.fill.offlineBanner} />
      <Stack gap="lg" padding="md">
        <ProgressHeader
          title={form.title}
          position={position}
          showProgressBar={form.showProgressBar}
          saveState={isPreview ? undefined : saveState}
          saveErrorKey={saveErrorKey}
          onRetrySave={onRetrySave}
        />
        {section.title !== undefined && section.title !== '' && (
          <Text size="lg" weight="bold" heading testID={testIds.fill.sectionTitle}>{section.title}</Text>
        )}
        {section.description !== undefined && section.description !== '' && <Text color="muted">{section.description}</Text>}
        {questions.map((question) => (
          <QuestionRenderer
            key={question.id}
            question={question}
            value={answers[question.id]}
            onChange={(value) => onChangeAnswer(question, value)}
            errorText={errors[question.id]}
            fileUpload={fileUpload}
            imageUrl={question.imagePath === undefined ? undefined : imageUrls[question.imagePath]}
          />
        ))}
        {submitErrorKey !== undefined && (
          <Row gap="sm">
            <Icon name="alert-circle" size={18} color="error" />
            <Text color="error" live testID={testIds.fill.submitError}>{t(submitErrorKey)}</Text>
          </Row>
        )}
        <Row gap="md" justify="space-between">
          {canGoBack ? (
            <Button label={t('fill.back')} variant="secondary" onPress={onBack} testID={testIds.fill.backButton} />
          ) : (
            <Stack>{null}</Stack>
          )}
          {isLastSection ? (
            <Button
              label={t('fill.submit')}
              onPress={onNext}
              disabled={!canSubmit}
              isLoading={isSubmitting}
              testID={testIds.fill.submitButton}
            />
          ) : (
            <Button label={t('fill.next')} onPress={onNext} testID={testIds.fill.nextButton} />
          )}
        </Row>
      </Stack>
      <ConfirmDialog
        visible={isConfirming}
        title={t('fill.submitTitle')}
        message={form.allowEditAfterSubmit ? t('fill.submitMessageEditable') : t('fill.submitMessage')}
        confirmLabel={t('fill.submit')}
        cancelLabel={t('common.cancel')}
        isLoading={isSubmitting}
        onConfirm={onConfirmSubmit}
        onCancel={onCancelSubmit}
        testID={testIds.fill.confirmDialog}
      />
    </Stack>
  );
}
