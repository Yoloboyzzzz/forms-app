import { useTranslation } from 'react-i18next';
import { testIds } from '@/constants/testIds';
import type { SaveState } from '@/state/useFormEditorStore';
import { Button, Icon, Row, Spinner, Text } from './primitives';

interface SaveIndicatorProps {
  state: SaveState;
  /** i18n key of the failure when `state` is `error`. */
  errorKey?: string;
  onRetry: () => void;
}

/** Shows whether the edits are saved; offers a retry after a failure. */
export function SaveIndicator({ state, errorKey, onRetry }: SaveIndicatorProps) {
  const { t } = useTranslation();

  if (state === 'idle') {
    return null;
  }

  return (
    <Row gap="sm" testID={testIds.editor.saveIndicator}>
      {state === 'saving' && (
        <>
          <Spinner label={t('editor.saving')} />
          <Text size="sm" color="muted" live>{t('editor.saving')}</Text>
        </>
      )}
      {state === 'dirty' && <Text size="sm" color="muted">{t('editor.unsaved')}</Text>}
      {state === 'saved' && (
        <>
          <Icon name="checkmark-circle" size={18} color="success" />
          <Text size="sm" color="success" live>{t('editor.saved')}</Text>
        </>
      )}
      {state === 'error' && (
        <>
          <Icon name="alert-circle" size={18} color="error" />
          <Text size="sm" color="error" live>
            {errorKey === undefined ? t('editor.saveFailed') : `${t('editor.saveFailed')}: ${t(errorKey)}`}
          </Text>
          <Button label={t('editor.retrySave')} variant="secondary" onPress={onRetry} testID={testIds.editor.retrySaveButton} />
        </>
      )}
    </Row>
  );
}
