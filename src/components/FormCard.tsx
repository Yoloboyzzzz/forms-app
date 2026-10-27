import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { Form } from '@/types/models';
import { formatDate } from '@/utils/formatDate';
import { FormStatusBadge } from './FormStatusBadge';
import { Card, Row, Stack, Text } from './primitives';

interface FormCardProps {
  form: Form;
  onPress: (form: Form) => void;
}

export function FormCard({ form, onPress }: FormCardProps) {
  const { t, i18n } = useTranslation();
  const title = form.title.trim() === '' ? t('form.untitled') : form.title;

  return (
    <Card onPress={() => onPress(form)} accessibilityLabel={title} testID={testIdFor.formCard(form.id)}>
      <Stack gap="sm" padding="md">
        <Row justify="space-between" gap="md">
          <Stack flex={1}>
            <Text size="lg" weight="bold" numberOfLines={2}>{title}</Text>
          </Stack>
          <FormStatusBadge status={form.status} />
        </Row>
        {form.description !== undefined && form.description !== '' && (
          <Text color="muted" numberOfLines={2}>{form.description}</Text>
        )}
        <Text size="sm" color="muted">{t('form.updatedOn', { date: formatDate(form.updatedAt, i18n.language) })}</Text>
      </Stack>
    </Card>
  );
}
