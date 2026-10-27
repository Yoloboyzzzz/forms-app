import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { testIds } from '@/constants/testIds';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { validateEmail, validateRequired } from '@/utils/authValidation';
import { Button, Icon, InputField, Stack, Text } from './primitives';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  onForgotPassword: () => void;
  isLoading?: boolean;
  /** i18n key of a failed sign-in, shown above the button. */
  errorKey?: string;
}

export function LoginForm({ onSubmit, onForgotPassword, isLoading = false, errorKey }: LoginFormProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailErrorKey, setEmailErrorKey] = useState<string | undefined>(undefined);
  const [passwordErrorKey, setPasswordErrorKey] = useState<string | undefined>(undefined);

  function submit(): void {
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validateRequired(password);
    setEmailErrorKey(nextEmailError);
    setPasswordErrorKey(nextPasswordError);
    if (nextEmailError === undefined && nextPasswordError === undefined) {
      onSubmit(email, password);
    }
  }

  return (
    <View style={styles.container} testID={testIds.login.screen}>
      <Stack gap="lg">
        <Text size="xl" weight="bold" align="center" heading>{t('login.title')}</Text>
        <InputField
          label={t('login.email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('login.emailPlaceholder')}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          error={emailErrorKey === undefined ? undefined : t(emailErrorKey)}
          testID={testIds.login.emailInput}
        />
        <InputField
          label={t('login.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          error={passwordErrorKey === undefined ? undefined : t(passwordErrorKey)}
          testID={testIds.login.passwordInput}
        />
        {errorKey !== undefined && (
          <View style={styles.error}>
            <Icon name="alert-circle" size={18} color="error" />
            <Text color="error" live testID={testIds.login.errorText}>{t(errorKey)}</Text>
          </View>
        )}
        <Button label={t('login.submit')} onPress={submit} isLoading={isLoading} testID={testIds.login.submitButton} />
        <Button
          label={t('login.forgotPassword')}
          variant="ghost"
          onPress={onForgotPassword}
          testID={testIds.login.forgotPasswordLink}
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
