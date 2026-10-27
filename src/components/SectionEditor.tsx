import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { SectionPatch } from '@/services/mappers/recordMappers';
import type { FormSection, Question } from '@/types/models';
import type { MoveDirection } from '@/utils/ordering';
import { afterActionValue, parseAfterActionValue, type SectionOption } from '@/utils/sectionActions';
import { QuestionEditor } from './QuestionEditor';
import { QuestionTypeEditor } from './QuestionTypeEditor';
import { Button, IconButton, InputField, Row, Select, Stack, Text, TextArea } from './primitives';

export interface QuestionHandlers {
  onChange: (question: Question) => void;
  onMove: (questionId: string, direction: MoveDirection) => void;
  onDuplicate: (questionId: string) => void;
  onDelete: (question: Question) => void;
}

export interface SectionHandlers {
  /** Typing in the title or description. */
  onEdit: (sectionId: string, patch: Pick<SectionPatch, 'title' | 'description'>) => void;
  /** Changing what happens after the section. */
  onChangeAfter: (sectionId: string, patch: SectionPatch) => void;
  onMove: (sectionId: string, direction: MoveDirection) => void;
  onDelete: (section: FormSection) => void;
}

interface SectionEditorProps {
  section: FormSection;
  /** 1-based position, shown in the heading. */
  position: number;
  /** All sections of the form, for jump targets. */
  sectionOptions: SectionOption[];
  /** The section's questions in order. */
  questions: Question[];
  questionHandlers: QuestionHandlers;
  sectionHandlers: SectionHandlers;
  onAddQuestion: (sectionId: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** A form always keeps at least one section. */
  canDelete: boolean;
}

export function SectionEditor({
  section,
  position,
  sectionOptions,
  questions,
  questionHandlers,
  sectionHandlers,
  onAddQuestion,
  canMoveUp,
  canMoveDown,
  canDelete,
}: SectionEditorProps) {
  const { t } = useTranslation();
  const field = (name: string) => testIdFor.sectionField(section.id, name);
  const action = (name: string) => testIdFor.sectionAction(section.id, name);

  return (
    <Stack gap="md" testID={testIdFor.section(section.id)}>
      <Row justify="space-between" gap="sm">
        <Text size="lg" weight="bold" heading>{t('editor.section', { n: position })}</Text>
        <Row>
          <IconButton icon="arrow-up" label={t('editor.moveSectionUp')} onPress={() => sectionHandlers.onMove(section.id, 'up')} disabled={!canMoveUp} testID={action('move-up')} />
          <IconButton icon="arrow-down" label={t('editor.moveSectionDown')} onPress={() => sectionHandlers.onMove(section.id, 'down')} disabled={!canMoveDown} testID={action('move-down')} />
          <IconButton icon="trash" color="error" label={t('editor.deleteSection')} onPress={() => sectionHandlers.onDelete(section)} disabled={!canDelete} testID={action('delete')} />
        </Row>
      </Row>
      <InputField
        label={t('editor.sectionTitle')}
        value={section.title ?? ''}
        onChangeText={(text) => sectionHandlers.onEdit(section.id, { title: text === '' ? undefined : text })}
        autoCapitalize="sentences"
        testID={field('title-input')}
      />
      <TextArea
        label={t('editor.sectionDescription')}
        value={section.description ?? ''}
        onChangeText={(text) => sectionHandlers.onEdit(section.id, { description: text === '' ? undefined : text })}
        autoCapitalize="sentences"
        testID={field('description-input')}
      />
      {questions.length === 0 && <Text color="muted">{t('editor.empty')}</Text>}
      {questions.map((question, index) => (
        <QuestionEditor
          key={question.id}
          question={question}
          onChange={questionHandlers.onChange}
          onMoveUp={() => questionHandlers.onMove(question.id, 'up')}
          onMoveDown={() => questionHandlers.onMove(question.id, 'down')}
          canMoveUp={index > 0}
          canMoveDown={index < questions.length - 1}
          onDuplicate={() => questionHandlers.onDuplicate(question.id)}
          onDelete={() => questionHandlers.onDelete(question)}
        >
          <QuestionTypeEditor question={question} onChange={questionHandlers.onChange} sections={sectionOptions} />
        </QuestionEditor>
      ))}
      <Button
        label={t('editor.addQuestion')}
        variant="secondary"
        onPress={() => onAddQuestion(section.id)}
        testID={testIdFor.addQuestionButton(section.id)}
      />
      {sectionOptions.length > 1 && (
        <Select
          label={t('editor.afterSection')}
          value={afterActionValue(section)}
          options={[
            { value: 'next', label: t('editor.afterNext') },
            ...sectionOptions
              .filter((option) => option.id !== section.id)
              .map((option) => ({ value: `goto:${option.id}`, label: t('editor.afterGoTo', { name: option.label }) })),
            { value: 'submit', label: t('editor.afterSubmit') },
          ]}
          onChange={(value) => sectionHandlers.onChangeAfter(section.id, parseAfterActionValue(value))}
          testID={field('after')}
        />
      )}
    </Stack>
  );
}
