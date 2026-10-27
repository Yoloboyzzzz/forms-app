import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { testIdFor, testIds } from '@/constants/testIds';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { NewUserInput } from '@/services/adminUserService';
import type { Theme } from '@/theme';
import { USER_ROLES, type UserRole } from '@/types/enums';
import { validateEmail, validateNewPassword, validateRequired } from '@/utils/authValidation';
import { Button, Icon, InputField, Radio, Row, Stack, Text } from './primitives';

interface CreateUserFormProps {
  onSubmit: (input: NewUserInput) => void;
  /** Returns a fresh random first-time password. */
  onGeneratePassword: () => string;
  onCopyPassword: (password: string) => void;
  copied?: boolean;
  isLoading?: boolean;
  /** i18n key of a failed attempt (for example an email that is already used). */
  errorKey?: string;
}

export function CreateUserForm({
  onSubmit,
  onGeneratePassword,
  onCopyPassword,
  copied = false,
  isLoading = false,
  errorKey,
}: CreateUserFormProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [password, setPassword] = useState('');
  const [errorKeys, setErrorKeys] = useState<Record<string, string | undefined>>({});

  function submit(): void {
    const next = {
      fullName: validateRequired(fullName),
      email: validateEmail(email),
      password: validateNewPassword(password),
    };
    setErrorKeys(next);
    if (next.fullName === undefined && next.email === undefined && next.password === undefined) {
      onSubmit({ fullName: fullName.trim(), email: email.trim(), role, password });
    }
  }

  function fieldError(field: string): string | undefined {
    const key = errorKeys[field];
    return key === undefined ? undefined : t(key);
  }

  return (
    <View style={styles.container} testID={testIds.createUser.screen}>
      <Stack gap="lg">
        <Text size="xl" weight="bold" heading>{t('createUser.title')}</Text>
        <InputField
          label={t('createUser.fullName')}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          textContentType="name"
          returnKeyType="next"
          error={fieldError('fullName')}
          testID={testIds.createUser.nameInput}
        />
        <InputField
          label={t('createUser.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          error={fieldError('email')}
          testID={testIds.createUser.emailInput}
        />
        <Stack gap="sm">
          <Text size="sm" weight="medium">{t('createUser.role')}</Text>
          {USER_ROLES.map((option) => (
            <Radio
              key={option}
              label={t(`role.${option}`)}
              value={option}
              selected={option === role}
              onSelect={() => setRole(option)}
              testID={testIdFor.createUserRole(option)}
            />
          ))}
        </Stack>
        {/* Shown in plain text on purpose: the admin has to read it out or copy it. */}
        <InputField
          label={t('createUser.password')}
          value={password}
          onChangeText={setPassword}
          autoComplete="off"
          returnKeyType="go"
          onSubmitEditing={submit}
          error={fieldError('password')}
          testID={testIds.createUser.passwordInput}
        />
        <Row gap="sm" wrap>
          <Button
            label={t('createUser.generate')}
            variant="secondary"
            onPress={() => setPassword(onGeneratePassword())}
            testID={testIds.createUser.generateButton}
          />
          <Button
            label={copied ? t('tempPassword.copied') : t('createUser.copy')}
            variant="ghost"
            onPress={() => onCopyPassword(password)}
            disabled={password === ''}
            testID={testIds.createUser.copyButton}
          />
        </Row>
        {errorKey !== undefined && (
          <View style={styles.error}>
            <Icon name="alert-circle" size={18} color="error" />
            <Text color="error" live testID={testIds.createUser.errorText}>{t(errorKey)}</Text>
          </View>
        )}
        <Button label={t('createUser.submit')} onPress={submit} isLoading={isLoading} testID={testIds.createUser.submitButton} />
      </Stack>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: theme.spacing.lg },
    error: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  });
