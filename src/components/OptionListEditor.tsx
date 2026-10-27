import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import { useNewId } from '@/hooks/useNewId';
import type { ChoiceOption } from '@/types/models';
import { moveItem, type MoveDirection } from '@/utils/ordering';
import { Button, IconButton, InputField, Row, Stack, Text } from './primitives';

interface OptionListEditorProps {
  /** Id of the question the options belong to, used in testIDs. */
  questionId: string;
  options: ChoiceOption[];
  onChange: (options: ChoiceOption[]) => void;
}

/** Edit the labels of a choice question's options; add, remove and reorder them. */
export function OptionListEditor({ questionId, options, onChange }: OptionListEditorProps) {
  const { t } = useTranslation();
  const newId = useNewId();

  function move(optionId: string, direction: MoveDirection): void {
    onChange(moveItem(options, optionId, direction));
  }

  return (
    <Stack gap="sm">
      <Text size="sm" weight="medium">{t('editor.options.title')}</Text>
      {options.map((option, index) => (
        <Row key={option.id} gap="sm" align="flex-end">
          <Stack flex={1}>
            <InputField
              label={t('editor.options.label', { n: index + 1 })}
              value={option.label}
              onChangeText={(label) => onChange(options.map((item) => (item.id === option.id ? { ...item, label } : item)))}
              autoCapitalize="sentences"
              testID={testIdFor.option(questionId, option.id)}
            />
          </Stack>
          <IconButton
            icon="arrow-up"
            label={t('editor.options.moveUp')}
            onPress={() => move(option.id, 'up')}
            disabled={index === 0}
            testID={testIdFor.optionAction(questionId, option.id, 'move-up')}
          />
          <IconButton
            icon="arrow-down"
            label={t('editor.options.moveDown')}
            onPress={() => move(option.id, 'down')}
            disabled={index === options.length - 1}
            testID={testIdFor.optionAction(questionId, option.id, 'move-down')}
          />
          <IconButton
            icon="close"
            label={t('editor.options.remove')}
            onPress={() => onChange(options.filter((item) => item.id !== option.id))}
            disabled={options.length <= 1}
            testID={testIdFor.optionAction(questionId, option.id, 'remove')}
          />
        </Row>
      ))}
      <Button
        label={t('editor.options.add')}
        variant="secondary"
        onPress={() => onChange([...options, { id: newId(), label: t('editor.options.label', { n: options.length + 1 }) }])}
        testID={testIdFor.optionAdd(questionId)}
      />
    </Stack>
  );
}
