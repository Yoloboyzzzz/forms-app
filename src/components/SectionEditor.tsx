import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { FormSection, Question } from '@/types/models';
import type { MoveDirection } from '@/utils/ordering';
import { QuestionEditor } from './QuestionEditor';
import { Button, Stack, Text } from './primitives';

export interface QuestionHandlers {
  onChange: (question: Question) => void;
  onMove: (questionId: string, direction: MoveDirection) => void;
  onDuplicate: (questionId: string) => void;
  onDelete: (question: Question) => void;
}

interface SectionEditorProps {
  section: FormSection;
  /** 1-based position, shown in the heading. */
  position: number;
  /** The section's questions in order. */
  questions: Question[];
  questionHandlers: QuestionHandlers;
  onAddQuestion: (sectionId: string) => void;
}

export function SectionEditor({ section, position, questions, questionHandlers, onAddQuestion }: SectionEditorProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="md" testID={testIdFor.section(section.id)}>
      <Text size="lg" weight="bold" heading>
        {section.title === undefined || section.title === '' ? t('editor.section', { n: position }) : section.title}
      </Text>
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
        />
      ))}
      <Button
        label={t('editor.addQuestion')}
        variant="secondary"
        onPress={() => onAddQuestion(section.id)}
        testID={testIdFor.addQuestionButton(section.id)}
      />
    </Stack>
  );
}
