import { useTranslation } from 'react-i18next';
import { testIds } from '@/constants/testIds';
import type { SaveState } from '@/state/useFormEditorStore';
import type { FormPatch } from '@/services/mappers/recordMappers';
import type { FormDetail } from '@/types/models';
import { questionsOfSection, sortedSections } from '@/utils/questions';
import { FormStatusBadge } from './FormStatusBadge';
import { SaveIndicator } from './SaveIndicator';
import { SectionEditor, type QuestionHandlers, type SectionHandlers } from './SectionEditor';
import { Button, Divider, InputField, Row, Stack, Text, TextArea } from './primitives';

interface FormEditorViewProps {
  detail: FormDetail;
  saveState: SaveState;
  saveErrorKey?: string;
  onRetrySave: () => void;
  onChangeForm: (patch: FormPatch) => void;
  questionHandlers: QuestionHandlers;
  sectionHandlers: SectionHandlers;
  onAddQuestion: (sectionId: string) => void;
  onAddSection: () => void;
}

/** The editable form: header, save status and every section with its questions. */
export function FormEditorView({
  detail,
  saveState,
  saveErrorKey,
  onRetrySave,
  onChangeForm,
  questionHandlers,
  sectionHandlers,
  onAddQuestion,
  onAddSection,
}: FormEditorViewProps) {
  const { t } = useTranslation();
  const sections = sortedSections(detail);
  const sectionOptions = sections.map((section, index) => ({
    id: section.id,
    label: section.title === undefined || section.title === '' ? t('editor.section', { n: index + 1 }) : section.title,
  }));

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
      {sections.map((section, index) => (
        <SectionEditor
          key={section.id}
          section={section}
          position={index + 1}
          sectionOptions={sectionOptions}
          questions={questionsOfSection(detail, section.id)}
          questionHandlers={questionHandlers}
          sectionHandlers={sectionHandlers}
          onAddQuestion={onAddQuestion}
          canMoveUp={index > 0}
          canMoveDown={index < sections.length - 1}
          canDelete={sections.length > 1}
        />
      ))}
      <Button label={t('editor.addSection')} variant="secondary" onPress={onAddSection} testID={testIds.editor.addSectionButton} />
    </Stack>
  );
}
