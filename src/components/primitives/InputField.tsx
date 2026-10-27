import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { Theme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  accessibilityHint?: string;
  /** Goes on the text input itself; the error message gets `${testID}-error`. */
  testID?: string;
}

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  disabled = false,
  multiline = false,
  keyboardType,
  autoComplete,
  textContentType,
  autoCapitalize = 'none',
  returnKeyType,
  onSubmitEditing,
  accessibilityHint,
  testID,
}: InputFieldProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const hasError = error !== undefined;

  return (
    <View style={styles.container}>
      <Text size="sm" weight="medium">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
        multiline={multiline}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        textContentType={textContentType}
        autoCapitalize={autoCapitalize}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        style={[styles.input, multiline && styles.inputMultiline, hasError && styles.inputError, disabled && styles.inputDisabled]}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        testID={testID}
      />
      {hasError && (
        <View style={styles.error}>
          <Icon name="alert-circle" size={16} color="error" />
          <Text size="sm" color="error" live testID={testID === undefined ? undefined : `${testID}-error`}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { gap: theme.spacing.xs },
    input: {
      minHeight: theme.minTouchTarget,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      ...theme.fontSizes.lg,
    },
    inputMultiline: { minHeight: theme.minTouchTarget * 2, textAlignVertical: 'top' },
    inputError: { borderColor: theme.colors.error },
    inputDisabled: { backgroundColor: theme.colors.surfaceMuted, color: theme.colors.textMuted },
    error: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  });
