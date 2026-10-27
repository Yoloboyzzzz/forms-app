import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { QUESTION_TYPE_ICONS } from '@/constants/questionTypes';
import { testIdFor, testIds } from '@/constants/testIds';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { EDITOR_QUESTION_TYPES, type QuestionType } from '@/types/enums';
import { Icon, Text } from './primitives';

interface QuestionTypePickerProps {
  visible: boolean;
  onPick: (type: QuestionType) => void;
  onClose: () => void;
  /** Types on offer; defaults to the ones the editor supports. */
  types?: readonly QuestionType[];
}

/** Modal list of question types. */
export function QuestionTypePicker({ visible, onPick, onClose, types = EDITOR_QUESTION_TYPES }: QuestionTypePickerProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.cancel')} />
      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.sheet} accessibilityViewIsModal testID={testIds.editor.typePicker}>
          <Text size="lg" weight="bold" heading>{t('editor.pickType')}</Text>
          <ScrollView>
            {types.map((type) => (
              <Pressable
                key={type}
                onPress={() => onPick(type)}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                accessibilityRole="button"
                accessibilityLabel={t(`questionType.${type}`)}
                testID={testIdFor.questionTypeOption(type)}
              >
                <Icon name={QUESTION_TYPE_ICONS[type]} size={22} color="primary" />
                <Text>{t(`questionType.${type}`)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    sheet: {
      alignSelf: 'stretch',
      maxWidth: 480,
      maxHeight: 520,
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.background,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      minHeight: theme.minTouchTarget,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radii.md,
    },
    optionPressed: { backgroundColor: theme.colors.surfaceMuted },
  });
