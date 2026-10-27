import { useTranslation } from 'react-i18next';
import { testIds } from '@/constants/testIds';
import { Screen, Text } from '@/components/primitives';

// Placeholder until the forms list is built (plan step 4.3).
export default function AdminFormsScreen() {
  const { t } = useTranslation();

  return (
    <Screen padding="lg" testID={testIds.adminForms.screen}>
      <Text size="xl" weight="bold" heading>{t('admin.forms.title')}</Text>
    </Screen>
  );
}
