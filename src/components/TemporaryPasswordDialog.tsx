import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { testIds } from '@/constants/testIds';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Button, Text } from './primitives';

interface TemporaryPasswordDialogProps {
  visible: boolean;
  /** Who the password is for. */
  userName: string;
  password: string;
  /** `created` after making an account, `reset` after a password reset. */
  reason: 'created' | 'reset';
  copied?: boolean;
  onCopy: () => void;
  onClose: () => void;
}

/** Shows a first-time password once, so the admin can copy it and hand it over outside the app. */
export function TemporaryPasswordDialog({
  visible,
  userName,
  password,
  reason,
  copied = false,
  onCopy,
  onClose,
}: TemporaryPasswordDialogProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('tempPassword.close')} />
      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.dialog} accessibilityViewIsModal testID={testIds.tempPassword.dialog}>
          <Text size="lg" weight="bold" heading>
            {t(reason === 'created' ? 'tempPassword.titleCreated' : 'tempPassword.titleReset')}
          </Text>
          <Text>{t('tempPassword.message', { name: userName })}</Text>
          <Text size="sm" color="muted">{t('tempPassword.label')}</Text>
          <View style={styles.password}>
            <Text size="lg" weight="bold" testID={testIds.tempPassword.value}>{password}</Text>
          </View>
          <Button
            label={copied ? t('tempPassword.copied') : t('tempPassword.copy')}
            variant="secondary"
            onPress={onCopy}
            testID={testIds.tempPassword.copyButton}
          />
          <Button label={t('tempPassword.close')} onPress={onClose} testID={testIds.tempPassword.closeButton} />
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
    password: {
      padding: theme.spacing.md,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
      alignItems: 'center',
    },
  });
