import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import { RATING_ICONS } from '@/types/enums';
import type { RatingSettings } from '@/types/models';
import { Row, Select, Stack } from './primitives';

const MAX_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10].map((value) => ({ value: String(value), label: String(value) }));

interface RatingEditorProps {
  questionId: string;
  settings: RatingSettings;
  onChange: (settings: RatingSettings) => void;
}

/** Rating settings: how many icons (3 to 10) and which icon. */
export function RatingEditor({ questionId, settings, onChange }: RatingEditorProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="sm">
      <Row gap="md" align="flex-start">
        <Stack flex={1}>
          <Select
            label={t('editor.rating.max')}
            value={String(settings.max ?? 5)}
            options={MAX_OPTIONS}
            onChange={(value) => onChange({ ...settings, max: Number(value) })}
            testID={testIdFor.setting(questionId, 'rating-max')}
          />
        </Stack>
        <Stack flex={1}>
          <Select
            label={t('editor.rating.icon')}
            value={settings.icon ?? 'star'}
            options={RATING_ICONS.map((icon) => ({ value: icon, label: t(`editor.rating.icons.${icon}`) }))}
            onChange={(value) => onChange({ ...settings, icon: RATING_ICONS.find((icon) => icon === value) ?? 'star' })}
            testID={testIdFor.setting(questionId, 'rating-icon')}
          />
        </Stack>
      </Row>
    </Stack>
  );
}
