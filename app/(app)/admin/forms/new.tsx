import { router } from 'expo-router';
import { NewFormForm } from '@/components/NewFormForm';
import { Screen } from '@/components/primitives';
import { routes } from '@/constants/routes';
import { useCreateForm } from '@/hooks/useCreateForm';

export default function NewFormScreen() {
  const { createForm, isLoading, errorKey } = useCreateForm();

  async function submit(draft: { title: string; description?: string }): Promise<void> {
    const form = await createForm(draft);
    if (form !== undefined) {
      router.replace(routes.admin.formEdit(form.id));
    }
  }

  return (
    <Screen padding="none">
      <NewFormForm onSubmit={submit} isLoading={isLoading} errorKey={errorKey} />
    </Screen>
  );
}
