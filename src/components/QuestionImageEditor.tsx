import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { Question } from '@/types/models';
import { QuestionImage } from './QuestionImage';
import { Button, Icon, Row, Stack, Text } from './primitives';

/** What the editor screen provides for question images. */
export interface QuestionImageControls {
  /** Temporary links by storage path. */
  urls: Record<string, string>;
  /** The question whose image is being uploaded or removed right now. */
  busyQuestionId?: string;
  /** Translated problems by question id. */
  errors: Record<string, string>;
  onPick: (question: Question) => void;
  onRemove: (question: Question) => void;
}

interface QuestionImageEditorProps {
  question: Question;
  controls: QuestionImageControls;
}

/** Add, change or remove the image of one question. */
export function QuestionImageEditor({ question, controls }: QuestionImageEditorProps) {
  const { t } = useTranslation();
  const url = question.imagePath === undefined ? undefined : controls.urls[question.imagePath];
  const isBusy = controls.busyQuestionId === question.id;
  const error = controls.errors[question.id];

  return (
    <Stack gap="sm">
      {url !== undefined && (
        <QuestionImage uri={url} description={question.title} testID={testIdFor.questionImage(question.id)} />
      )}
      <Row gap="sm" wrap>
        <Button
          label={question.imagePath === undefined ? t('editor.image.add') : t('editor.image.change')}
          variant="secondary"
          onPress={() => controls.onPick(question)}
          isLoading={isBusy}
          disabled={!question.isActive}
          testID={testIdFor.questionAction(question.id, 'image')}
        />
        {question.imagePath !== undefined && (
          <Button
            label={t('editor.image.remove')}
            variant="ghost"
            onPress={() => controls.onRemove(question)}
            disabled={isBusy || !question.isActive}
            testID={testIdFor.questionAction(question.id, 'image-remove')}
          />
        )}
      </Row>
      {error !== undefined && (
        <Row gap="sm">
          <Icon name="alert-circle" size={16} color="error" />
          <Text size="sm" color="error" live testID={testIdFor.questionAction(question.id, 'image-error')}>{error}</Text>
        </Row>
      )}
    </Stack>
  );
}
