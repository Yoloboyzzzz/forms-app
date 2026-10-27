import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Styles the confirm button as destructive (delete, unassign, archive). */
  destructive?: boolean;
  isLoading?: boolean;
  testID?: string;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
  isLoading = false,
  testID,
}: ConfirmDialogProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel={cancelLabel} accessibilityRole="button" />
      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.dialog} accessibilityViewIsModal testID={testID}>
          <Text size="lg" weight="bold" heading>{title}</Text>
          <Text>{message}</Text>
          <View style={styles.actions}>
            <Button
              label={cancelLabel}
              variant="ghost"
              onPress={onCancel}
              testID={testID === undefined ? undefined : `${testID}-cancel`}
            />
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              isLoading={isLoading}
              testID={testID === undefined ? undefined : `${testID}-confirm`}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    dialog: {
      alignSelf: 'stretch',
      maxWidth: 480,
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.background,
    },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing.sm },
  });
