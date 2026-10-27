import { router } from 'expo-router';
import { CreateUserForm } from '@/components/CreateUserForm';
import { Screen } from '@/components/primitives';
import { TemporaryPasswordDialog } from '@/components/TemporaryPasswordDialog';
import { routes } from '@/constants/routes';
import { useCreateUser } from '@/hooks/useCreateUser';

export default function NewUserScreen() {
  const createUser = useCreateUser();

  function finish(): void {
    createUser.dismissCreated();
    router.replace(routes.admin.users);
  }

  return (
    <Screen padding="none">
      <CreateUserForm
        onSubmit={createUser.createUser}
        onGeneratePassword={createUser.generatePassword}
        onCopyPassword={createUser.copyPassword}
        copied={createUser.copied}
        isLoading={createUser.isLoading}
        errorKey={createUser.errorKey}
      />
      <TemporaryPasswordDialog
        visible={createUser.created !== undefined}
        userName={createUser.created?.userName ?? ''}
        password={createUser.created?.password ?? ''}
        reason="created"
        copied={createUser.copied}
        onCopy={() => createUser.copyPassword(createUser.created?.password ?? '')}
        onClose={finish}
      />
    </Screen>
  );
}
