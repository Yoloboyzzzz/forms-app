import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { FileUploadSettings } from '@/types/models';
import { InputField, Row, Select, Stack } from './primitives';

const FILE_COUNTS = [1, 5, 10].map((value) => ({ value: String(value), label: String(value) }));
const FILE_SIZES = [1, 2, 5, 10].map((value) => ({ value: String(value), label: `${value} MB` }));

interface FileUploadEditorProps {
  questionId: string;
  settings: FileUploadSettings;
  onChange: (settings: FileUploadSettings) => void;
}

/** Upload limits: which types are allowed (empty means all), how many files and how large each may be. */
export function FileUploadEditor({ questionId, settings, onChange }: FileUploadEditorProps) {
  const { t } = useTranslation();
  const [typesText, setTypesText] = useState((settings.allowedTypes ?? []).join(', '));

  function changeTypes(text: string): void {
    setTypesText(text);
    const allowedTypes = text
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry !== '');
    onChange({ ...settings, allowedTypes: allowedTypes.length === 0 ? undefined : allowedTypes });
  }

  return (
    <Stack gap="sm">
      <InputField
        label={t('editor.upload.allowedTypes')}
        value={typesText}
        onChangeText={changeTypes}
        placeholder={t('editor.upload.allowedTypesHint')}
        testID={testIdFor.setting(questionId, 'allowed-types')}
      />
      <Row gap="md" align="flex-start">
        <Stack flex={1}>
          <Select
            label={t('editor.upload.maxFiles')}
            value={String(settings.maxFiles ?? 1)}
            options={FILE_COUNTS}
            onChange={(value) => onChange({ ...settings, maxFiles: value === '10' ? 10 : value === '5' ? 5 : 1 })}
            testID={testIdFor.setting(questionId, 'max-files')}
          />
        </Stack>
        <Stack flex={1}>
          <Select
            label={t('editor.upload.maxSize')}
            value={String(settings.maxFileSizeMb ?? 10)}
            options={FILE_SIZES}
            onChange={(value) => onChange({ ...settings, maxFileSizeMb: Number(value) })}
            testID={testIdFor.setting(questionId, 'max-size')}
          />
        </Stack>
      </Row>
    </Stack>
  );
}
