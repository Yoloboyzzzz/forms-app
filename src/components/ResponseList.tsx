import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { testIdFor, testIds } from '@/constants/testIds';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import type { ResponseRow } from '@/types/models';
import { formatDateTime } from '@/utils/formatDate';
import { Badge, Card, Row, Stack, Text } from './primitives';

type RowStatus = 'notStarted' | 'draft' | 'submitted';

const VARIANT = { notStarted: 'default', draft: 'warning', submitted: 'success' } as const satisfies Record<
  RowStatus,
  'default' | 'warning' | 'success'
>;

function statusOf(row: ResponseRow): RowStatus {
  return row.submission === undefined ? 'notStarted' : row.submission.status;
}

interface ResponseListProps {
  rows: ResponseRow[];
  /** Called for people who have a response (draft or submitted). */
  onOpen: (row: ResponseRow) => void;
}

/** Everyone the form is assigned to with the state of their response. */
export function ResponseList({ rows, onOpen }: ResponseListProps) {
  const { t, i18n } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row.assignment.id}
      renderItem={({ item }) => {
        const status = statusOf(item);
        const content = (
          <Stack gap="sm" padding="md">
            <Row justify="space-between" gap="md">
              <Stack flex={1}>
                <Text weight="bold" numberOfLines={1}>{item.user.fullName || item.user.email}</Text>
                <Text size="sm" color="muted" numberOfLines={1}>{item.user.email}</Text>
              </Stack>
              <Badge label={t(`responses.status.${status}`)} variant={VARIANT[status]} />
            </Row>
            {item.submission?.submittedAt !== undefined && (
              <Text size="sm" color="muted">
                {t('responses.submittedOn', { date: formatDateTime(item.submission.submittedAt, i18n.language) })}
              </Text>
            )}
          </Stack>
        );
        return item.submission === undefined ? (
          <Card testID={testIdFor.responseRow(item.assignment.id)}>{content}</Card>
        ) : (
          <Card onPress={() => onOpen(item)} testID={testIdFor.responseRow(item.assignment.id)}>
            {content}
          </Card>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={styles.content}
      testID={testIds.responses.list}
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    content: { padding: theme.spacing.md },
    separator: { height: theme.spacing.sm },
  });
