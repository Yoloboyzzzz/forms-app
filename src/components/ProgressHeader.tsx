import { useTranslation } from 'react-i18next';
import { testIds } from '@/constants/testIds';
import type { FillSaveState } from '@/state/useFillStore';
import { Button, Icon, ProgressBar, Row, Spinner, Stack, Text } from './primitives';

interface ProgressHeaderProps {
  title: string;
  position: { current: number; total: number };
  /** Draws the progress bar (the form's "show progress bar" setting). */
  showProgressBar: boolean;
  /** Hidden in preview, where nothing is saved. */
  saveState?: FillSaveState;
  saveErrorKey?: string;
  onRetrySave?: () => void;
}

/** Form title, "Section 2 of 3", an optional progress bar and the draft save status. */
export function ProgressHeader({
  title,
  position,
  showProgressBar,
  saveState,
  saveErrorKey,
  onRetrySave,
}: ProgressHeaderProps) {
  const { t } = useTranslation();
  const label = t('fill.sectionOf', position);

  return (
    <Stack gap="sm">
      <Text size="xl" weight="bold" heading>{title}</Text>
      <Text size="sm" color="muted" testID={testIds.fill.progress}>{label}</Text>
      {showProgressBar && <ProgressBar value={position.current / position.total} label={label} />}
      {saveState !== undefined && saveState !== 'idle' && (
        <Row gap="sm" testID={testIds.fill.saveIndicator}>
          {saveState === 'saving' && (
            <>
              <Spinner label={t('fill.saving')} />
              <Text size="sm" color="muted" live>{t('fill.saving')}</Text>
            </>
          )}
          {saveState === 'dirty' && <Text size="sm" color="muted">{t('fill.unsaved')}</Text>}
          {saveState === 'saved' && (
            <>
              <Icon name="checkmark-circle" size={16} color="success" />
              <Text size="sm" color="success" live>{t('fill.saved')}</Text>
            </>
          )}
          {saveState === 'error' && (
            <>
              <Icon name="alert-circle" size={16} color="error" />
              <Text size="sm" color="error" live>
                {saveErrorKey === undefined ? t('fill.saveFailed') : `${t('fill.saveFailed')}: ${t(saveErrorKey)}`}
              </Text>
              {onRetrySave && (
                <Button label={t('fill.retrySave')} variant="secondary" onPress={onRetrySave} testID={testIds.fill.retrySaveButton} />
              )}
            </>
          )}
        </Row>
      )}
    </Stack>
  );
}
