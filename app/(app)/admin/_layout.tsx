import { useTranslation } from 'react-i18next';
import { AppTabs } from '@/components/AppTabs';
import { RouteGuard } from '@/components/RouteGuard';
import { testIds } from '@/constants/testIds';
import { useRouteAccess } from '@/hooks/useRouteAccess';

export default function AdminLayout() {
  const { t } = useTranslation();
  const access = useRouteAccess('admin');

  return (
    <RouteGuard access={access}>
      <AppTabs
        tabs={[
          { name: 'forms', title: t('tabs.forms'), icon: 'document-text', testID: testIds.tabs.adminForms },
          { name: 'profile', title: t('tabs.profile'), icon: 'person-circle', testID: testIds.tabs.adminProfile },
        ]}
      />
    </RouteGuard>
  );
}
