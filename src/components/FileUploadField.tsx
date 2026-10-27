import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { AnswerValue, FileUploadQuestion } from '@/types/models';
import { fileNameOf } from '@/utils/uploads';
import { QuestionFrame } from './QuestionFrame';
import { Button, Icon, IconButton, Row, Stack, Text } from './primitives';

interface FileUploadFieldProps {
  question: FileUploadQuestion;
  value: AnswerValue | undefined;
  onPick: () => void;
  onRemove: (path: string) => void;
  isUploading?: boolean;
  /** Translated reason the last file was refused or failed to upload. */
  uploadErrorText?: string;
  /** Translated error under the answer (for example "required"). */
  errorText?: string;
}

/** Attach files to a question; shows what was uploaded and lets the respondent remove files again. */
export function FileUploadField({ question, value, onPick, onRemove, isUploading = false, uploadErrorText, errorText }: FileUploadFieldProps) {
  const { t } = useTranslation();
  const paths = Array.isArray(value) ? value : [];
  const max = question.settings.maxFiles ?? 1;

  return (
    <QuestionFrame question={question} errorText={errorText}>
      <Stack gap="sm">
        {paths.map((path) => (
          <Row key={path} gap="sm" justify="space-between" testID={testIdFor.uploadedFile(question.id, path)}>
            <Row gap="sm">
              <Icon name="document-attach" size={20} color="primary" />
              <Text numberOfLines={1}>{fileNameOf(path)}</Text>
            </Row>
            <IconButton
              icon="close"
              color="error"
              label={t('fill.upload.remove', { name: fileNameOf(path) })}
              onPress={() => onRemove(path)}
              testID={testIdFor.removeUploadedFile(question.id, path)}
            />
          </Row>
        ))}
        {paths.length < max && (
          <Button
            label={t('fill.upload.add')}
            variant="secondary"
            onPress={onPick}
            isLoading={isUploading}
            testID={testIdFor.uploadButton(question.id)}
          />
        )}
        {uploadErrorText !== undefined && (
          <Row gap="sm">
            <Icon name="alert-circle" size={16} color="error" />
            <Text size="sm" color="error" live testID={testIdFor.uploadError(question.id)}>{uploadErrorText}</Text>
          </Row>
        )}
      </Stack>
    </QuestionFrame>
  );
}
