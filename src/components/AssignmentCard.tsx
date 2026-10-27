import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { MyAssignment } from '@/types/models';
import { getAssignmentStatus, type AssignmentStatus } from '@/utils/assignmentStatus';
import { formatDate } from '@/utils/formatDate';
import { Badge, Card, Row, Stack, Text } from './primitives';

const VARIANT = {
  notStarted: 'default',
  inProgress: 'warning',
  submitted: 'success',
  overdue: 'error',
} as const satisfies Record<AssignmentStatus, 'default' | 'warning' | 'success' | 'error'>;

interface AssignmentCardProps {
  item: MyAssignment;
  onPress: (item: MyAssignment) => void;
  /** The current time; injected so the card is testable. */
  now?: Date;
}

/** One assigned form: title, status and due date. */
export function AssignmentCard({ item, onPress, now = new Date() }: AssignmentCardProps) {
  const { t, i18n } = useTranslation();
  const status = getAssignmentStatus(item, now);
  const { dueAt } = item.assignment;
  const title = item.form.title.trim() === '' ? t('form.untitled') : item.form.title;

  return (
    <Card onPress={() => onPress(item)} accessibilityLabel={title} testID={testIdFor.assignmentCard(item.assignment.id)}>
      <Stack gap="sm" padding="md">
        <Row justify="space-between" gap="md">
          <Stack flex={1}>
            <Text size="lg" weight="bold" numberOfLines={2}>{title}</Text>
          </Stack>
          <Badge label={t(`assignment.status.${status}`)} variant={VARIANT[status]} />
        </Row>
        {item.form.description !== undefined && item.form.description !== '' && (
          <Text color="muted" numberOfLines={2}>{item.form.description}</Text>
        )}
        <Text size="sm" color={status === 'overdue' ? 'error' : 'muted'}>
          {dueAt === undefined ? t('assignment.noDueDate') : t('assignment.dueOn', { date: formatDate(dueAt, i18n.language) })}
        </Text>
      </Stack>
    </Card>
  );
}
