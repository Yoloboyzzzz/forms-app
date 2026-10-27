import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { testIds } from '@/constants/testIds';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Button, Icon, Stack, Text } from './primitives';

interface ConfirmationScreenProps {
  /** The form's own confirmation message; a default is shown without one. */
  message?: string;
  /** Offered when the form allows editing after submitting. */
  onEdit?: () => void;
  isEditing?: boolean;
  /** i18n key when reopening failed. */
  editErrorKey?: string;
  onBack: () => void;
}

/** Shown after a form was submitted. */
export function ConfirmationScreen({ message, onEdit, isEditing = false, editErrorKey, onBack }: ConfirmationScreenProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container} testID={testIds.done.screen}>
      <Stack gap="lg" align="center">
        <Icon name="checkmark-circle" size={64} color="success" />
        <Text size="xl" weight="bold" align="center" heading>{t('done.title')}</Text>
        <Text align="center" testID={testIds.done.message}>
          {message === undefined || message === '' ? t('done.defaultMessage') : message}
        </Text>
        {editErrorKey !== undefined && (
          <Text color="error" align="center" live testID={testIds.done.editError}>{t(editErrorKey)}</Text>
        )}
        {onEdit && (
          <Button label={t('done.edit')} variant="secondary" onPress={onEdit} isLoading={isEditing} testID={testIds.done.editButton} />
        )}
        <Button label={t('done.backToForms')} onPress={onBack} testID={testIds.done.backButton} />
      </Stack>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: theme.spacing.lg },
  });
