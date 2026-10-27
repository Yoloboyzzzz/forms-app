import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { ValidationRule } from '@/types/models';
import {
  createRule,
  maxText,
  ruleInputs,
  valueText,
  VALIDATION_OPERATORS,
  withErrorMessage,
  withMax,
  withOperator,
  withValue,
  type ValidationKind,
} from '@/utils/validation';
import { InputField, Select, Stack, Switch, Text } from './primitives';

interface ValidationRuleEditorProps {
  /** Id of the question the rule belongs to, used in testIDs. */
  questionId: string;
  rule?: ValidationRule;
  /** Kinds of rules offered for this question type. */
  kinds: readonly ValidationKind[];
  onChange: (rule: ValidationRule | undefined) => void;
}

/** Response validation like Google Forms: pick a rule type and condition, then its value(s) and an error message. */
export function ValidationRuleEditor({ questionId, rule, kinds, onChange }: ValidationRuleEditorProps) {
  const { t } = useTranslation();
  const id = (part: string) => testIdFor.validation(questionId, part);
  const inputs = rule === undefined ? undefined : ruleInputs(rule);
  const numeric = rule?.kind === 'number' || rule?.kind === 'length' || rule?.kind === 'checkboxCount';

  return (
    <Stack gap="sm">
      <Switch
        label={t('editor.validation.enable')}
        value={rule !== undefined}
        onValueChange={(enabled) => onChange(enabled ? createRule(kinds[0]) : undefined)}
        testID={id('switch')}
      />
      {rule !== undefined && inputs !== undefined && (
        <Stack gap="sm">
          <Text size="sm" weight="medium">{t('editor.validation.title')}</Text>
          {kinds.length > 1 && (
            <Select
              label={t('editor.validation.kind')}
              value={rule.kind}
              options={kinds.map((kind) => ({ value: kind, label: t(`validation.kind.${kind}`) }))}
              onChange={(kind) => onChange(createRule(kinds.find((candidate) => candidate === kind) ?? kinds[0]))}
              testID={id('kind')}
            />
          )}
          <Select
            label={t('editor.validation.operator')}
            value={rule.operator}
            options={VALIDATION_OPERATORS[rule.kind].map((operator) => ({
              value: operator,
              label: t(`validation.operator.${rule.kind}.${operator}`),
            }))}
            onChange={(operator) => onChange(withOperator(rule, operator))}
            testID={id('operator')}
          />
          {inputs.value && (
            <InputField
              label={t('editor.validation.value')}
              value={valueText(rule)}
              onChangeText={(text) => onChange(withValue(rule, text))}
              keyboardType={numeric ? 'numbers-and-punctuation' : 'default'}
              testID={id('value')}
            />
          )}
          {inputs.max && (
            <InputField
              label={t('editor.validation.max')}
              value={maxText(rule)}
              onChangeText={(text) => onChange(withMax(rule, text))}
              keyboardType="numbers-and-punctuation"
              testID={id('max')}
            />
          )}
          <InputField
            label={t('editor.validation.errorMessage')}
            value={rule.errorMessage ?? ''}
            onChangeText={(text) => onChange(withErrorMessage(rule, text))}
            autoCapitalize="sentences"
            testID={id('error-message')}
          />
        </Stack>
      )}
    </Stack>
  );
}
