import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { testIds } from '@/constants/testIds';
import type { Language } from '@/i18n';
import type { Profile } from '@/types/models';
import { validateRequired } from '@/utils/authValidation';
import { ChangePasswordForm } from './ChangePasswordForm';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button, Divider, InputField, Stack, Text, Toast } from './primitives';

interface ProfileViewProps {
  profile: Profile;
  language: Language;
  onChangeLanguage: (language: Language) => void;
  onSaveName: (fullName: string) => void;
  isSavingName?: boolean;
  /** Shows the "name saved" confirmation. */
  nameSaved?: boolean;
  nameErrorKey?: string;
  onChangePassword: (newPassword: string) => void;
  isChangingPassword?: boolean;
  passwordChanged?: boolean;
  passwordErrorKey?: string;
  onLogout: () => void;
}

export function ProfileView({
  profile,
  language,
  onChangeLanguage,
  onSaveName,
  isSavingName = false,
  nameSaved = false,
  nameErrorKey,
  onChangePassword,
  isChangingPassword = false,
  passwordChanged = false,
  passwordErrorKey,
  onLogout,
}: ProfileViewProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(profile.fullName);
  const [nameValidationKey, setNameValidationKey] = useState<string | undefined>(undefined);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  function saveName(): void {
    const validationKey = validateRequired(name);
    setNameValidationKey(validationKey);
    if (validationKey === undefined) {
      onSaveName(name);
    }
  }

  const shownNameErrorKey = nameValidationKey ?? nameErrorKey;

  return (
    <Stack gap="lg" padding="lg" testID={testIds.profile.screen}>
      <Text size="xl" weight="bold" heading>{t('profile.title')}</Text>

      <Stack gap="sm">
        <Text size="sm" color="muted">{t('profile.email')}</Text>
        <Text testID={testIds.profile.emailText}>{profile.email}</Text>
        <Text size="sm" color="muted">{t('profile.role')}</Text>
        <Text>{t(`role.${profile.role}`)}</Text>
      </Stack>

      <Stack gap="sm">
        <InputField
          label={t('profile.name')}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          error={shownNameErrorKey === undefined ? undefined : t(shownNameErrorKey)}
          testID={testIds.profile.nameInput}
        />
        <Button
          label={t('profile.saveName')}
          onPress={saveName}
          isLoading={isSavingName}
          disabled={name.trim() === profile.fullName}
          testID={testIds.profile.saveNameButton}
        />
        <Toast message={t('profile.nameSaved')} variant="success" visible={nameSaved} testID={testIds.profile.nameSavedMessage} />
      </Stack>

      <Divider />

      <Stack gap="sm">
        <Text weight="medium">{t('profile.language')}</Text>
        <LanguageSwitcher language={language} onChange={onChangeLanguage} />
      </Stack>

      <Divider />

      {showPasswordForm ? (
        <Stack gap="sm">
          <ChangePasswordForm
            mode="voluntary"
            onSubmit={onChangePassword}
            isLoading={isChangingPassword}
            errorKey={passwordErrorKey}
          />
          <Button label={t('profile.hidePasswordForm')} variant="ghost" onPress={() => setShowPasswordForm(false)} />
        </Stack>
      ) : (
        <Button
          label={t('profile.changePassword')}
          variant="secondary"
          onPress={() => setShowPasswordForm(true)}
          testID={testIds.profile.changePasswordToggle}
        />
      )}
      <Toast
        message={t('changePassword.saved')}
        variant="success"
        visible={passwordChanged}
        testID={testIds.profile.passwordSavedMessage}
      />

      <Button label={t('common.logout')} variant="ghost" onPress={onLogout} testID={testIds.profile.logoutButton} />
    </Stack>
  );
}
