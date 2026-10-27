import { FlatList, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import type { Profile } from '@/types/models';
import { UserListItem } from './UserListItem';

interface UserListProps {
  users: Profile[];
  currentUserId?: string;
  onResetPassword: (user: Profile) => void;
  onChangeRole: (user: Profile) => void;
  /** Pull-to-refresh. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
  testID?: string;
}

export function UserList({
  users,
  currentUserId,
  onResetPassword,
  onChangeRole,
  onRefresh,
  isRefreshing = false,
  testID,
}: UserListProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <FlatList
      data={users}
      keyExtractor={(user) => user.id}
      renderItem={({ item }) => (
        <UserListItem
          user={item}
          isSelf={item.id === currentUserId}
          onResetPassword={onResetPassword}
          onChangeRole={onChangeRole}
        />
      )}
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
