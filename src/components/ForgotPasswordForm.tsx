import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { testIds } from '@/constants/testIds';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import {
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
  validateRecoveryCode,
} from '@/utils/authValidation';
import { Button, Icon, InputField, Stack, Text } from './primitives';

interface ForgotPasswordFormProps {
  /** `email`: ask for the address. `code`: enter the emailed code and a new password. */
  step: 'email' | 'code';
  onRequestCode: (email: string) => void;
  onResendCode: () => void;
  onSubmit: (code: string, newPassword: string) => void;
  onBackToLogin: () => void;
  isLoading?: boolean;
  /** i18n key of a failed attempt (wrong or expired code, weak password, rate limit). */
  errorKey?: string;
}

export function ForgotPasswordForm({
  step,
  onRequestCode,
  onResendCode,
  onSubmit,
  onBackToLogin,
  isLoading = false,
  errorKey,
}: ForgotPasswordFormProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errorKeys, setErrorKeys] = useState<Record<string, string | undefined>>({});

  function requestCode(): void {
    const emailError = validateEmail(email);
    setErrorKeys({ email: emailError });
    if (emailError === undefined) {
      onRequestCode(email);
    }
  }

  function submit(): void {
    const next = {
      code: validateRecoveryCode(code),
      password: validateNewPassword(password),
      confirmation: validatePasswordConfirmation(password, confirmation),
    };
    setErrorKeys(next);
    if (next.code === undefined && next.password === undefined && next.confirmation === undefined) {
      onSubmit(code.trim(), password);
    }
  }

  function fieldError(field: string): string | undefined {
    const key = errorKeys[field];
    return key === undefined ? undefined : t(key);
  }

  return (
    <View style={styles.container} testID={testIds.forgotPassword.screen}>
      <Stack gap="lg">
        <Text size="xl" weight="bold" align="center" heading>{t('forgotPassword.title')}</Text>

        {step === 'email' ? (
          <>
            <Text color="muted">{t('forgotPassword.emailHint')}</Text>
            <InputField
              label={t('forgotPassword.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="go"
              onSubmitEditing={requestCode}
              error={fieldError('email')}
              testID={testIds.forgotPassword.emailInput}
            />
            <Button
              label={t('forgotPassword.sendCode')}
              onPress={requestCode}
              isLoading={isLoading}
              testID={testIds.forgotPassword.sendCodeButton}
            />
          </>
        ) : (
          <>
            {/* The same message is shown whether or not the address has an account. */}
            <Text color="muted" live testID={testIds.forgotPassword.neutralMessage}>
              {t('forgotPassword.neutralMessage')}
            </Text>
            <InputField
              label={t('forgotPassword.code')}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              returnKeyType="next"
              error={fieldError('code')}
              testID={testIds.forgotPassword.codeInput}
            />
            <InputField
              label={t('forgotPassword.newPassword')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              error={fieldError('password')}
              testID={testIds.forgotPassword.newPasswordInput}
            />
            <InputField
              label={t('forgotPassword.confirmPassword')}
              value={confirmation}
              onChangeText={setConfirmation}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
              error={fieldError('confirmation')}
              testID={testIds.forgotPassword.confirmPasswordInput}
            />
            {errorKey !== undefined && (
              <View style={styles.error}>
                <Icon name="alert-circle" size={18} color="error" />
                <Text color="error" live testID={testIds.forgotPassword.errorText}>{t(errorKey)}</Text>
              </View>
            )}
            <Button
              label={t('forgotPassword.submit')}
              onPress={submit}
              isLoading={isLoading}
              testID={testIds.forgotPassword.submitButton}
            />
            <Button
              label={t('forgotPassword.resend')}
              variant="secondary"
              onPress={onResendCode}
              disabled={isLoading}
              testID={testIds.forgotPassword.resendButton}
            />
          </>
        )}

        {step === 'email' && errorKey !== undefined && (
          <View style={styles.error}>
            <Icon name="alert-circle" size={18} color="error" />
            <Text color="error" live testID={testIds.forgotPassword.errorText}>{t(errorKey)}</Text>
          </View>
        )}
        <Button
          label={t('forgotPassword.backToLogin')}
          variant="ghost"
          onPress={onBackToLogin}
          testID={testIds.forgotPassword.backToLoginLink}
        />
      </Stack>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: theme.spacing.lg },
    error: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  });
