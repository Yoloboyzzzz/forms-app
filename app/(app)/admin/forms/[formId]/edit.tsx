import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormActionsBar } from '@/components/FormActionsBar';
import { FormEditorView } from '@/components/FormEditorView';
import { Button, ConfirmDialog, EmptyState, Screen, Skeleton, Stack, Toast } from '@/components/primitives';
import { QuestionTypePicker } from '@/components/QuestionTypePicker';
import { routes } from '@/constants/routes';
import { testIds } from '@/constants/testIds';
import { useFormEditor } from '@/hooks/useFormEditor';

export default function FormEditorScreen() {
  const { t } = useTranslation();
  const { formId } = useLocalSearchParams<{ formId: string }>();
  const editor = useFormEditor(formId, {
    onDuplicated: (copyId) => router.replace(routes.admin.formEdit(copyId)),
  });

  function renderContent() {
    if (editor.errorKey !== undefined) {
      return (
        <EmptyState
          title={t('editor.loadError')}
          description={t(editor.errorKey)}
          action={<Button label={t('common.retry')} onPress={editor.reload} testID={testIds.editor.retryLoadButton} />}
          testID={testIds.editor.loadError}
        />
      );
    }
    if (editor.detail === undefined || editor.isLoading) {
      return (
        <Stack gap="sm" padding="md" testID={testIds.editor.loading}>
          <Skeleton height={48} radius="md" />
          <Skeleton height={160} radius="md" />
          <Skeleton height={160} radius="md" />
        </Stack>
      );
    }
    return (
      <>
        <Stack padding="md">
          <FormActionsBar
            onSettings={() => router.push(routes.admin.formSettings(formId))}
            onPreview={() => router.push(routes.admin.formPreview(formId))}
            onAssign={() => router.push(routes.admin.formAssign(formId))}
            onPublish={editor.detail.form.status === 'draft' ? () => editor.requestAction('publish') : undefined}
            onArchive={editor.detail.form.status === 'archived' ? undefined : () => editor.requestAction('archive')}
            onDuplicate={() => editor.requestAction('duplicate')}
            isWorking={editor.isWorking}
          />
        </Stack>
        <FormEditorView
          detail={editor.detail}
          saveState={editor.saveState}
          saveErrorKey={editor.saveErrorKey}
          onRetrySave={editor.retrySave}
          onChangeForm={editor.changeForm}
          questionHandlers={editor.questionHandlers}
          sectionHandlers={editor.sectionHandlers}
          onAddQuestion={editor.openPicker}
          onAddSection={() => void editor.addSection()}
        />
      </>
    );
  }

  const messageKey = editor.actionErrorKey ?? editor.noticeKey;

  return (
    <Screen padding="none">
      {renderContent()}
      <QuestionTypePicker visible={editor.pickerSectionId !== undefined} onPick={editor.addQuestion} onClose={editor.closePicker} />
      <ConfirmDialog
        visible={editor.deleteTarget !== undefined}
        title={t('editor.deleteTitle')}
        message={t('editor.deleteMessage')}
        confirmLabel={t('editor.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => void editor.confirmDelete()}
        onCancel={editor.cancelDelete}
        testID={testIds.editor.deleteDialog}
      />
      <ConfirmDialog
        visible={editor.pendingAction !== undefined}
        title={t(`editor.${editor.pendingAction ?? 'publish'}Title`)}
        message={t(`editor.${editor.pendingAction ?? 'publish'}Message`)}
        confirmLabel={t(`editorActions.${editor.pendingAction ?? 'publish'}`)}
        cancelLabel={t('common.cancel')}
        destructive={editor.pendingAction === 'archive'}
        onConfirm={() => void editor.confirmAction()}
        onCancel={editor.cancelAction}
        testID={testIds.editorActions.confirmDialog}
      />
      <ConfirmDialog
        visible={editor.sectionToDelete !== undefined}
        title={t('editor.deleteSectionTitle')}
        message={t('editor.deleteSectionMessage')}
        confirmLabel={t('editor.deleteSection')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => void editor.confirmDeleteSection()}
        onCancel={editor.cancelDeleteSection}
        testID={testIds.editor.deleteSectionDialog}
      />
      <Toast
        message={messageKey === undefined ? '' : t(messageKey)}
        variant={editor.actionErrorKey === undefined ? editor.noticeVariant : 'error'}
        visible={messageKey !== undefined}
        testID={testIds.editor.notice}
      />
    </Screen>
  );
}
