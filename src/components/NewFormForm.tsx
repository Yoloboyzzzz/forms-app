import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { testIds } from '@/constants/testIds';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { validateRequired } from '@/utils/authValidation';
import { Button, Icon, InputField, Stack, Text, TextArea } from './primitives';

interface NewFormFormProps {
  onSubmit: (draft: { title: string; description?: string }) => void;
  isLoading?: boolean;
  /** i18n key of a failed attempt. */
  errorKey?: string;
}

export function NewFormForm({ onSubmit, isLoading = false, errorKey }: NewFormFormProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleErrorKey, setTitleErrorKey] = useState<string | undefined>(undefined);

  function submit(): void {
    const nextError = validateRequired(title);
    setTitleErrorKey(nextError);
    if (nextError === undefined) {
      const trimmedDescription = description.trim();
      onSubmit({ title: title.trim(), description: trimmedDescription === '' ? undefined : trimmedDescription });
    }
  }

  return (
    <View style={styles.container} testID={testIds.newForm.screen}>
      <Stack gap="lg">
        <Text size="xl" weight="bold" heading>{t('forms.new.title')}</Text>
        <InputField
          label={t('forms.new.formTitle')}
          value={title}
          onChangeText={setTitle}
          autoCapitalize="sentences"
          returnKeyType="next"
          error={titleErrorKey === undefined ? undefined : t(titleErrorKey)}
          testID={testIds.newForm.titleInput}
        />
        <TextArea
          label={t('forms.new.description')}
          value={description}
          onChangeText={setDescription}
          autoCapitalize="sentences"
          testID={testIds.newForm.descriptionInput}
        />
        {errorKey !== undefined && (
          <View style={styles.error}>
            <Icon name="alert-circle" size={18} color="error" />
            <Text color="error" live testID={testIds.newForm.errorText}>{t(errorKey)}</Text>
          </View>
        )}
        <Button label={t('forms.new.submit')} onPress={submit} isLoading={isLoading} testID={testIds.newForm.submitButton} />
      </Stack>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: theme.spacing.lg },
    error: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  });
