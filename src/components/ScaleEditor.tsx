import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { LinearScaleSettings } from '@/types/models';
import { InputField, Row, Select, Stack } from './primitives';

const MIN_OPTIONS = [0, 1].map((value) => ({ value: String(value), label: String(value) }));
const MAX_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => ({ value: String(value), label: String(value) }));

interface ScaleEditorProps {
  questionId: string;
  settings: LinearScaleSettings;
  onChange: (settings: LinearScaleSettings) => void;
}

/** Linear scale settings: range (0 or 1 up to 2 to 10) and optional labels at both ends. */
export function ScaleEditor({ questionId, settings, onChange }: ScaleEditorProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="sm">
      <Row gap="md" align="flex-start">
        <Stack flex={1}>
          <Select
            label={t('editor.scale.min')}
            value={String(settings.min ?? 1)}
            options={MIN_OPTIONS}
            onChange={(value) => onChange({ ...settings, min: value === '0' ? 0 : 1 })}
            testID={testIdFor.scale(questionId, 'min')}
          />
        </Stack>
        <Stack flex={1}>
          <Select
            label={t('editor.scale.max')}
            value={String(settings.max ?? 5)}
            options={MAX_OPTIONS}
            onChange={(value) => onChange({ ...settings, max: Number(value) })}
            testID={testIdFor.scale(questionId, 'max')}
          />
        </Stack>
      </Row>
      <InputField
        label={t('editor.scale.minLabel')}
        value={settings.minLabel ?? ''}
        onChangeText={(text) => onChange({ ...settings, minLabel: text === '' ? undefined : text })}
        autoCapitalize="sentences"
        testID={testIdFor.scale(questionId, 'min-label')}
      />
      <InputField
        label={t('editor.scale.maxLabel')}
        value={settings.maxLabel ?? ''}
        onChangeText={(text) => onChange({ ...settings, maxLabel: text === '' ? undefined : text })}
        autoCapitalize="sentences"
        testID={testIdFor.scale(questionId, 'max-label')}
      />
    </Stack>
  );
}
