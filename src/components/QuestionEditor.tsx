import { useTranslation } from 'react-i18next';
import { QUESTION_TYPE_ICONS } from '@/constants/questionTypes';
import { testIdFor } from '@/constants/testIds';
import type { Question } from '@/types/models';
import { Badge, Card, Icon, IconButton, InputField, Row, Stack, Switch, Text, TextArea } from './primitives';

interface QuestionEditorProps {
  question: Question;
  onChange: (question: Question) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  /** Type specific editors (options, scale, validation, ...) rendered below the common fields. */
  children?: React.ReactNode;
}

/** Editor card for one question: common fields plus actions. Type specific parts come in as children. */
export function QuestionEditor({
  question,
  onChange,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onDuplicate,
  onDelete,
  children,
}: QuestionEditorProps) {
  const { t } = useTranslation();

  return (
    <Card testID={testIdFor.question(question.id)}>
      <Stack gap="md" padding="md">
        <Row gap="sm" justify="space-between">
          <Row gap="sm">
            <IconTypeLabel question={question} />
            {!question.isActive && <Badge label={t('editor.deactivated')} variant="warning" />}
          </Row>
          <Row>
            <IconButton
              icon="arrow-up"
              label={t('editor.moveUp')}
              onPress={onMoveUp}
              disabled={!canMoveUp}
              testID={testIdFor.questionAction(question.id, 'move-up')}
            />
            <IconButton
              icon="arrow-down"
              label={t('editor.moveDown')}
              onPress={onMoveDown}
              disabled={!canMoveDown}
              testID={testIdFor.questionAction(question.id, 'move-down')}
            />
            <IconButton
              icon="copy"
              label={t('editor.duplicate')}
              onPress={onDuplicate}
              testID={testIdFor.questionAction(question.id, 'duplicate')}
            />
            <IconButton
              icon="trash"
              label={t('editor.delete')}
              color="error"
              onPress={onDelete}
              testID={testIdFor.questionAction(question.id, 'delete')}
            />
          </Row>
        </Row>
        <InputField
          label={t('editor.questionTitle')}
          value={question.title}
          onChangeText={(title) => onChange({ ...question, title })}
          autoCapitalize="sentences"
          disabled={!question.isActive}
          testID={testIdFor.questionTitleInput(question.id)}
        />
        <TextArea
          label={t('editor.questionDescription')}
          value={question.description ?? ''}
          onChangeText={(text) => onChange({ ...question, description: text === '' ? undefined : text })}
          autoCapitalize="sentences"
          disabled={!question.isActive}
          testID={testIdFor.questionDescriptionInput(question.id)}
        />
        {children}
        <Switch
          label={t('editor.required')}
          value={question.isRequired}
          onValueChange={(isRequired) => onChange({ ...question, isRequired })}
          disabled={!question.isActive}
          testID={testIdFor.questionRequiredSwitch(question.id)}
        />
      </Stack>
    </Card>
  );
}

function IconTypeLabel({ question }: { question: Question }) {
  const { t } = useTranslation();
  return (
    <Row gap="sm">
      <Icon name={QUESTION_TYPE_ICONS[question.questionType]} size={20} color="primary" />
      <Text size="sm" weight="medium" color="muted">{t(`questionType.${question.questionType}`)}</Text>
    </Row>
  );
}
