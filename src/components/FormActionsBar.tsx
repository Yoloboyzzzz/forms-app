import { useTranslation } from 'react-i18next';
import { testIds } from '@/constants/testIds';
import { Button, Row, Stack } from './primitives';

interface FormActionsBarProps {
  /** Each action shows up only when its handler is given. */
  onSettings?: () => void;
  onPreview?: () => void;
  onAssign?: () => void;
  onResponses?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onDuplicate?: () => void;
  isWorking?: boolean;
}

/** Row of actions on one form: settings, preview, assign, responses, publish, archive and duplicate. */
export function FormActionsBar({
  onSettings,
  onPreview,
  onAssign,
  onResponses,
  onPublish,
  onArchive,
  onDuplicate,
  isWorking = false,
}: FormActionsBarProps) {
  const { t } = useTranslation();
  const ids = testIds.editorActions;

  return (
    <Stack gap="sm">
      <Row gap="sm" wrap>
        {onSettings && <Button label={t('editorActions.settings')} variant="secondary" onPress={onSettings} testID={ids.settings} />}
        {onPreview && <Button label={t('editorActions.preview')} variant="secondary" onPress={onPreview} testID={ids.preview} />}
        {onAssign && <Button label={t('editorActions.assign')} variant="secondary" onPress={onAssign} testID={ids.assign} />}
        {onResponses && <Button label={t('editorActions.responses')} variant="secondary" onPress={onResponses} testID={ids.responses} />}
        {onDuplicate && (
          <Button label={t('editorActions.duplicate')} variant="secondary" onPress={onDuplicate} disabled={isWorking} testID={ids.duplicate} />
        )}
      </Row>
      <Row gap="sm" wrap>
        {onPublish && <Button label={t('editorActions.publish')} onPress={onPublish} isLoading={isWorking} testID={ids.publish} />}
        {onArchive && <Button label={t('editorActions.archive')} variant="danger" onPress={onArchive} disabled={isWorking} testID={ids.archive} />}
      </Row>
    </Stack>
  );
}
