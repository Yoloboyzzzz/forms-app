import { FlatList, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import type { Form } from '@/types/models';
import { FormCard } from './FormCard';

interface FormListProps {
  forms: Form[];
  onPressForm: (form: Form) => void;
  /** Pull-to-refresh. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
  testID?: string;
}

export function FormList({ forms, onPressForm, onRefresh, isRefreshing = false, testID }: FormListProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <FlatList
      data={forms}
      keyExtractor={(form) => form.id}
      renderItem={({ item }) => <FormCard form={item} onPress={onPressForm} />}
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
