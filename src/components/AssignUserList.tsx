import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';
import { testIdFor, testIds } from '@/constants/testIds';
import type { FormAssignee, Profile } from '@/types/models';
import { formatDate } from '@/utils/formatDate';
import { Button, Checkbox, Divider, InputField, Row, Stack, Text } from './primitives';

interface AssignUserListProps {
  /** People the form is already assigned to. */
  assignees: FormAssignee[];
  /** People that can still be added (already filtered by the search). */
  candidates: Profile[];
  /** How many people could be added before searching; tells "everyone is assigned" from "no match". */
  totalCandidates: number;
  selectedIds: string[];
  onToggle: (userId: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  dueDateText: string;
  onDueDateChange: (text: string) => void;
  dueDateInvalid?: boolean;
  onSubmit: () => void;
  onUnassign: (assignee: FormAssignee) => void;
  isSubmitting?: boolean;
}

/** Who has the form, and a searchable list to add more people with an optional due date. */
export function AssignUserList({
  assignees,
  candidates,
  totalCandidates,
  selectedIds,
  onToggle,
  query,
  onQueryChange,
  dueDateText,
  onDueDateChange,
  dueDateInvalid = false,
  onSubmit,
  onUnassign,
  isSubmitting = false,
}: AssignUserListProps) {
  const { t, i18n } = useTranslation();

  const header = (
    <Stack gap="md" padding="md">
      <Text size="lg" weight="bold" heading>{t('assign.assigned')}</Text>
      {assignees.length === 0 ? (
        <Text color="muted" testID={testIds.assign.noneAssigned}>{t('assign.noneAssigned')}</Text>
      ) : (
        <Stack gap="sm" testID={testIds.assign.assigneeList}>
          {assignees.map((assignee) => (
            <Row key={assignee.assignment.id} justify="space-between" gap="md" testID={testIdFor.assignee(assignee.assignment.id)}>
              <Stack flex={1}>
                <Text weight="medium" numberOfLines={1}>{assignee.user.fullName || assignee.user.email}</Text>
                <Text size="sm" color="muted" numberOfLines={1}>
                  {assignee.assignment.dueAt === undefined
                    ? t('assign.noDueDate')
                    : t('assign.dueOn', { date: formatDate(assignee.assignment.dueAt, i18n.language) })}
                </Text>
              </Stack>
              <Button
                label={t('assign.unassign')}
                variant="ghost"
                onPress={() => onUnassign(assignee)}
                testID={testIdFor.unassignButton(assignee.assignment.id)}
              />
            </Row>
          ))}
        </Stack>
      )}
      <Divider />
      <Text size="lg" weight="bold" heading>{t('assign.addPeople')}</Text>
      <InputField
        label={t('assign.search')}
        value={query}
        onChangeText={onQueryChange}
        testID={testIds.assign.searchInput}
      />
      {candidates.length === 0 && (
        <Text color="muted" testID={testIds.assign.noCandidates}>
          {totalCandidates === 0 ? t('assign.noCandidates') : t('assign.noMatches')}
        </Text>
      )}
    </Stack>
  );

  const footer = (
    <Stack gap="md" padding="md">
      <InputField
        label={t('assign.dueDate')}
        value={dueDateText}
        onChangeText={onDueDateChange}
        error={dueDateInvalid ? t('assign.dueDateInvalid') : undefined}
        testID={testIds.assign.dueDateInput}
      />
      <Button
        label={selectedIds.length === 0 ? t('assign.submitNone') : t('assign.submit', { count: selectedIds.length })}
        onPress={onSubmit}
        disabled={selectedIds.length === 0 || dueDateInvalid}
        isLoading={isSubmitting}
        testID={testIds.assign.submitButton}
      />
    </Stack>
  );

  return (
    <FlatList
      data={candidates}
      keyExtractor={(user) => user.id}
      renderItem={({ item }) => (
        <Stack padding="sm">
          <Checkbox
            label={item.fullName === '' ? item.email : `${item.fullName} (${item.email})`}
            checked={selectedIds.includes(item.id)}
            onChange={() => onToggle(item.id)}
            testID={testIdFor.assignCandidate(item.id)}
          />
        </Stack>
      )}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      keyboardShouldPersistTaps="handled"
      testID={testIds.assign.candidateList}
    />
  );
}
