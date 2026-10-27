import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** Keeps the label for screen readers but does not draw it. */
  hideLabel?: boolean;
  /** Translated label for the backdrop that closes the list. */
  closeLabel?: string;
  /** Goes on the trigger; options get `${testID}-option-${value}`, the error `${testID}-error`. */
  testID?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  hideLabel = false,
  closeLabel,
  testID,
}: SelectProps) {
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const hasError = error !== undefined;

  return (
    <View style={styles.container}>
      {!hideLabel && <Text size="sm" weight="medium">{label}</Text>}
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        style={[styles.trigger, hasError && styles.triggerError, disabled && styles.disabled]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label }}
        accessibilityState={{ disabled, expanded: open }}
        testID={testID}
      >
        <Text color={selected === undefined ? 'muted' : 'default'}>{selected?.label ?? placeholder ?? ''}</Text>
        <Icon name="chevron-down" size={18} color="muted" />
      </Pressable>
      {hasError && (
        <View style={styles.error}>
          <Icon name="alert-circle" size={16} color="error" />
          <Text size="sm" color="error" live testID={testID === undefined ? undefined : `${testID}-error`}>
            {error}
          </Text>
        </View>
      )}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
        />
        <View style={styles.center} pointerEvents="box-none">
          <ScrollView style={styles.list} accessibilityViewIsModal>
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: option.value === value }}
                testID={testID === undefined ? undefined : `${testID}-option-${option.value}`}
              >
                <Text weight={option.value === value ? 'bold' : 'normal'}>{option.label}</Text>
                {option.value === value && <Icon name="checkmark" size={18} color="primary" />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { gap: theme.spacing.xs },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      minHeight: theme.minTouchTarget,
      paddingHorizontal: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surface,
    },
    triggerError: { borderColor: theme.colors.error },
    disabled: { opacity: 0.5 },
    error: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
    list: {
      alignSelf: 'stretch',
      maxWidth: 480,
      maxHeight: 400,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.background,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: theme.minTouchTarget,
      paddingHorizontal: theme.spacing.md,
    },
    optionPressed: { backgroundColor: theme.colors.surfaceMuted },
  });
