import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmationScreen } from '@/components/ConfirmationScreen';
import { Button, EmptyState, Screen, Skeleton, Stack } from '@/components/primitives';
import { routes } from '@/constants/routes';
import { testIds } from '@/constants/testIds';
import { useDonePage } from '@/hooks/useDonePage';

export default function DoneScreen() {
  const { t } = useTranslation();
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const done = useDonePage(assignmentId);
  const { isLoading, isSubmitted, form, errorKey } = done;

  // Nothing was submitted (yet): send the user to the form itself.
  useEffect(() => {
    if (!isLoading && errorKey === undefined && form !== undefined && !isSubmitted) {
      router.replace(routes.user.fill(assignmentId));
    }
  }, [isLoading, errorKey, form, isSubmitted, assignmentId]);

  if (errorKey !== undefined) {
    return (
      <Screen>
        <EmptyState
          title={t('fill.loadError')}
          description={t(errorKey)}
          action={<Button label={t('fill.backToForms')} onPress={() => router.replace(routes.user.forms)} />}
        />
      </Screen>
    );
  }
  if (form === undefined || isLoading) {
    return (
      <Screen>
        <Stack gap="sm" testID={testIds.fill.loading}>
          <Skeleton height={64} radius="md" />
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen padding="none">
      <ConfirmationScreen
        message={form.confirmationMessage}
        onEdit={
          form.allowEditAfterSubmit
            ? () => void done.edit().then((ok) => ok && router.replace(routes.user.fill(assignmentId)))
            : undefined
        }
        isEditing={done.isEditing}
        editErrorKey={done.editErrorKey}
        onBack={() => router.replace(routes.user.forms)}
      />
    </Screen>
  );
}
