import { Screen } from '@/components/primitives';
import { ProfileView } from '@/components/ProfileView';
import { useProfileScreen } from '@/hooks/useProfileScreen';

export default function UserProfileScreen() {
  const profileScreen = useProfileScreen();

  if (profileScreen.profile === undefined) {
    return null;
  }
  return (
    <Screen padding="none">
      <ProfileView
        profile={profileScreen.profile}
        language={profileScreen.language}
        onChangeLanguage={profileScreen.setLanguage}
        onSaveName={profileScreen.saveName}
        isSavingName={profileScreen.isSavingName}
        nameSaved={profileScreen.nameSaved}
        nameErrorKey={profileScreen.nameErrorKey}
        onChangePassword={profileScreen.changePassword}
        isChangingPassword={profileScreen.isChangingPassword}
        passwordChanged={profileScreen.passwordChanged}
        passwordErrorKey={profileScreen.passwordErrorKey}
        onLogout={profileScreen.logout}
      />
    </Screen>
  );
}
