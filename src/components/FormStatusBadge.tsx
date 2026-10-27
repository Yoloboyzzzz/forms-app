import { useTranslation } from 'react-i18next';
import type { FormStatus } from '@/types/enums';
import { Badge } from './primitives';

const VARIANT = { draft: 'default', published: 'success', archived: 'warning' } as const satisfies Record<
  FormStatus,
  'default' | 'success' | 'warning'
>;

interface FormStatusBadgeProps {
  status: FormStatus;
  testID?: string;
}

export function FormStatusBadge({ status, testID }: FormStatusBadgeProps) {
  const { t } = useTranslation();
  return <Badge label={t(`form.status.${status}`)} variant={VARIANT[status]} testID={testID} />;
}
