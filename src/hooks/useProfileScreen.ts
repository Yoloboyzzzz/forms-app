import { useState } from 'react';
import { toServiceError } from '@/services/errors';
import { useAuthStore } from '@/state/useAuthStore';
import { useSettingsStore } from '@/state/useSettingsStore';
import type { Language } from '@/i18n';
import type { Profile } from '@/types/models';
import { useChangePassword } from './useChangePassword';

interface UseProfileScreen {
  profile?: Profile;
  language: Language;
  setLanguage: (language: Language) => void;
  saveName: (fullName: string) => Promise<void>;
  isSavingName: boolean;
  nameSaved: boolean;
  nameErrorKey?: string;
  changePassword: (newPassword: string) => Promise<void>;
  isChangingPassword: boolean;
  passwordChanged: boolean;
  passwordErrorKey?: string;
  logout: () => Promise<void>;
}

/** Glue for the Profile screen: name, language, voluntary password change and logout. */
export function useProfileScreen(): UseProfileScreen {
  const profile = useAuthStore((state) => state.profile);
  const updateName = useAuthStore((state) => state.updateName);
  const signOut = useAuthStore((state) => state.signOut);
  const language = useSettingsStore((state) => state.language);
  const setLanguageStore = useSettingsStore((state) => state.setLanguage);
  const passwordChange = useChangePassword();

  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameErrorKey, setNameErrorKey] = useState<string | undefined>(undefined);
  const [passwordChanged, setPasswordChanged] = useState(false);

  async function saveName(fullName: string): Promise<void> {
    setNameErrorKey(undefined);
    setNameSaved(false);
    setIsSavingName(true);
    try {
      await updateName(fullName);
      setNameSaved(true);
    } catch (error) {
      setNameErrorKey(toServiceError(error).messageKey);
    } finally {
      setIsSavingName(false);
    }
  }

  async function changePassword(newPassword: string): Promise<void> {
    setPasswordChanged(false);
    setPasswordChanged(await passwordChange.changePassword(newPassword));
  }

  return {
    profile,
    language,
    setLanguage: (next) => void setLanguageStore(next),
    saveName,
    isSavingName,
    nameSaved,
    nameErrorKey,
    changePassword,
    isChangingPassword: passwordChange.isLoading,
    passwordChanged,
    passwordErrorKey: passwordChange.errorKey,
    logout: signOut,
  };
}
