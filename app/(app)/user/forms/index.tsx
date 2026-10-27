import { useTranslation } from 'react-i18next';
import { testIds } from '@/constants/testIds';
import { Screen, Text } from '@/components/primitives';

// Placeholder until the assigned forms list is built (plan step 5.3).
export default function UserFormsScreen() {
  const { t } = useTranslation();

  return (
    <Screen padding="lg" testID={testIds.userForms.screen}>
      <Text size="xl" weight="bold" heading>{t('user.forms.title')}</Text>
    </Screen>
  );
}
