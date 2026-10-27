import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { testIds } from '@/constants/testIds';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { validateNewPassword, validatePasswordConfirmation } from '@/utils/authValidation';
import { Button, Icon, InputField, Stack, Text } from './primitives';

interface ChangePasswordFormProps {
  /** `forced` is the first-login change: only "save" and "log out" are offered. */
  mode: 'forced' | 'voluntary';
  onSubmit: (newPassword: string) => void;
  /** Required in forced mode. */
  onLogout?: () => void;
  isLoading?: boolean;
  /** i18n key of a failed attempt. */
  errorKey?: string;
}

export function ChangePasswordForm({ mode, onSubmit, onLogout, isLoading = false, errorKey }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [passwordErrorKey, setPasswordErrorKey] = useState<string | undefined>(undefined);
  const [confirmationErrorKey, setConfirmationErrorKey] = useState<string | undefined>(undefined);

  function submit(): void {
    const nextPasswordError = validateNewPassword(password);
    const nextConfirmationError = validatePasswordConfirmation(password, confirmation);
    setPasswordErrorKey(nextPasswordError);
    setConfirmationErrorKey(nextConfirmationError);
    if (nextPasswordError === undefined && nextConfirmationError === undefined) {
      onSubmit(password);
    }
  }

  return (
    <View style={styles.container} testID={testIds.changePassword.screen}>
      <Stack gap="lg">
        <Text size="xl" weight="bold" align="center" heading>
          {t(mode === 'forced' ? 'changePassword.titleForced' : 'changePassword.titleVoluntary')}
        </Text>
        {mode === 'forced' && <Text color="muted">{t('changePassword.forcedHint')}</Text>}
        <InputField
          label={t('changePassword.newPassword')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          error={passwordErrorKey === undefined ? undefined : t(passwordErrorKey)}
          testID={testIds.changePassword.newPasswordInput}
        />
        <InputField
          label={t('changePassword.confirmPassword')}
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
          error={confirmationErrorKey === undefined ? undefined : t(confirmationErrorKey)}
          testID={testIds.changePassword.confirmPasswordInput}
        />
        {errorKey !== undefined && (
          <View style={styles.error}>
            <Icon name="alert-circle" size={18} color="error" />
            <Text color="error" live testID={testIds.changePassword.errorText}>{t(errorKey)}</Text>
          </View>
        )}
        <Button
          label={t('changePassword.submit')}
          onPress={submit}
          isLoading={isLoading}
          testID={testIds.changePassword.submitButton}
        />
        {mode === 'forced' && onLogout !== undefined && (
          <Button
            label={t('common.logout')}
            variant="ghost"
            onPress={onLogout}
            testID={testIds.changePassword.logoutButton}
          />
        )}
      </Stack>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: theme.spacing.lg },
    error: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  });
