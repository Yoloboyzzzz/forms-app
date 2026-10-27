import { FlatList, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import type { MyAssignment } from '@/types/models';
import { AssignmentCard } from './AssignmentCard';

interface AssignmentListProps {
  items: MyAssignment[];
  onPressItem: (item: MyAssignment) => void;
  /** Pull-to-refresh. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
  testID?: string;
}

export function AssignmentList({ items, onPressItem, onRefresh, isRefreshing = false, testID }: AssignmentListProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.assignment.id}
      renderItem={({ item }) => <AssignmentCard item={item} onPress={onPressItem} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      contentContainerStyle={styles.content}
      testID={testID}
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    content: { padding: theme.spacing.md },
    separator: { height: theme.spacing.sm },
  });
