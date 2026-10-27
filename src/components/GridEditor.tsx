import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import { useNewId } from '@/hooks/useNewId';
import type { GridLine, GridOptions, GridSettings } from '@/types/models';
import { moveItem } from '@/utils/ordering';
import { Button, IconButton, InputField, Row, Stack, Switch, Text } from './primitives';

interface GridEditorProps {
  questionId: string;
  options: GridOptions;
  settings: GridSettings;
  onChangeOptions: (options: GridOptions) => void;
  onChangeSettings: (settings: GridSettings) => void;
}

interface LinesProps {
  questionId: string;
  kind: 'row' | 'column';
  lines: GridLine[];
  onChange: (lines: GridLine[]) => void;
}

function LinesEditor({ questionId, kind, lines, onChange }: LinesProps) {
  const { t } = useTranslation();
  const newId = useNewId();
  const labelKey = kind === 'row' ? 'editor.grid.rowLabel' : 'editor.grid.columnLabel';

  return (
    <Stack gap="sm">
      <Text size="sm" weight="medium">{t(kind === 'row' ? 'editor.grid.rows' : 'editor.grid.columns')}</Text>
      {lines.map((line, index) => (
        <Row key={line.id} gap="sm" align="flex-end">
          <Stack flex={1}>
            <InputField
              label={t(labelKey, { n: index + 1 })}
              value={line.label}
              onChangeText={(label) => onChange(lines.map((item) => (item.id === line.id ? { ...item, label } : item)))}
              autoCapitalize="sentences"
              testID={testIdFor.gridLine(questionId, kind, line.id)}
            />
          </Stack>
          <IconButton
            icon="arrow-up"
            label={t('editor.grid.moveUp')}
            onPress={() => onChange(moveItem(lines, line.id, 'up'))}
            disabled={index === 0}
            testID={testIdFor.gridLineAction(questionId, kind, line.id, 'move-up')}
          />
          <IconButton
            icon="arrow-down"
            label={t('editor.grid.moveDown')}
            onPress={() => onChange(moveItem(lines, line.id, 'down'))}
            disabled={index === lines.length - 1}
            testID={testIdFor.gridLineAction(questionId, kind, line.id, 'move-down')}
          />
          <IconButton
            icon="close"
            label={t(kind === 'row' ? 'editor.grid.removeRow' : 'editor.grid.removeColumn')}
            onPress={() => onChange(lines.filter((item) => item.id !== line.id))}
            disabled={lines.length <= 1}
            testID={testIdFor.gridLineAction(questionId, kind, line.id, 'remove')}
          />
        </Row>
      ))}
      <Button
        label={t(kind === 'row' ? 'editor.grid.addRow' : 'editor.grid.addColumn')}
        variant="secondary"
        onPress={() => onChange([...lines, { id: newId(), label: t(labelKey, { n: lines.length + 1 }) }])}
        testID={testIdFor.gridAdd(questionId, kind)}
      />
    </Stack>
  );
}

/** Rows and columns of a grid question, and its settings. Rows and columns always keep at least one entry. */
export function GridEditor({ questionId, options, settings, onChangeOptions, onChangeSettings }: GridEditorProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <LinesEditor
        questionId={questionId}
        kind="row"
        lines={options.rows}
        onChange={(rows) => onChangeOptions({ ...options, rows })}
      />
      <LinesEditor
        questionId={questionId}
        kind="column"
        lines={options.columns}
        onChange={(columns) => onChangeOptions({ ...options, columns })}
      />
      <Switch
        label={t('editor.grid.requireEachRow')}
        value={settings.requireEachRow ?? false}
        onValueChange={(requireEachRow) => onChangeSettings({ ...settings, requireEachRow })}
        testID={testIdFor.setting(questionId, 'each-row')}
      />
      <Switch
        label={t('editor.grid.limitOnePerColumn')}
        value={settings.limitOnePerColumn ?? false}
        onValueChange={(limitOnePerColumn) => onChangeSettings({ ...settings, limitOnePerColumn })}
        testID={testIdFor.setting(questionId, 'one-per-column')}
      />
      <Switch
        label={t('editor.grid.shuffleRows')}
        value={settings.shuffleRows ?? false}
        onValueChange={(shuffleRows) => onChangeSettings({ ...settings, shuffleRows })}
        testID={testIdFor.setting(questionId, 'shuffle-rows')}
      />
    </Stack>
  );
}
