import { useTranslation } from 'react-i18next';
import { testIds } from '@/constants/testIds';
import type { SaveState } from '@/state/useFormEditorStore';
import type { FormPatch } from '@/services/mappers/recordMappers';
import type { FormDetail } from '@/types/models';
import { questionsOfSection, sortedSections } from '@/utils/questions';
import { FormStatusBadge } from './FormStatusBadge';
import { SaveIndicator } from './SaveIndicator';
import { SectionEditor, type QuestionHandlers } from './SectionEditor';
import { Divider, InputField, Row, Stack, Text, TextArea } from './primitives';

interface FormEditorViewProps {
  detail: FormDetail;
  saveState: SaveState;
  saveErrorKey?: string;
  onRetrySave: () => void;
  onChangeForm: (patch: FormPatch) => void;
  questionHandlers: QuestionHandlers;
  onAddQuestion: (sectionId: string) => void;
}

/** The editable form: header, save status and every section with its questions. */
export function FormEditorView({
  detail,
  saveState,
  saveErrorKey,
  onRetrySave,
  onChangeForm,
  questionHandlers,
  onAddQuestion,
}: FormEditorViewProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="lg" padding="md" testID={testIds.editor.screen}>
      <Row justify="space-between" gap="md">
        <Text size="xl" weight="bold" heading>{t('editor.title')}</Text>
        <FormStatusBadge status={detail.form.status} />
      </Row>
      <SaveIndicator state={saveState} errorKey={saveErrorKey} onRetry={onRetrySave} />
      <InputField
        label={t('editor.formTitle')}
        value={detail.form.title}
        onChangeText={(title) => onChangeForm({ title })}
        autoCapitalize="sentences"
        testID={testIds.editor.titleInput}
      />
      <TextArea
        label={t('editor.formDescription')}
        value={detail.form.description ?? ''}
        onChangeText={(text) => onChangeForm({ description: text === '' ? undefined : text })}
        autoCapitalize="sentences"
        testID={testIds.editor.descriptionInput}
      />
      <Divider />
      {sortedSections(detail).map((section, index) => (
        <SectionEditor
          key={section.id}
          section={section}
          position={index + 1}
          questions={questionsOfSection(detail, section.id)}
          questionHandlers={questionHandlers}
          onAddQuestion={onAddQuestion}
        />
      ))}
    </Stack>
  );
}
