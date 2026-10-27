import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { testIds } from '@/constants/testIds';
import type { FormPatch } from '@/services/mappers/recordMappers';
import type { Form } from '@/types/models';
import { formatDateTimeInput, parseDateTimeInput } from '@/utils/dateInput';
import { InputField, Stack, Switch, Text, TextArea } from './primitives';

interface FormSettingsPanelProps {
  form: Form;
  onChange: (patch: FormPatch) => void;
}

/** Google Forms style settings of one form. Changes are reported one setting at a time. */
export function FormSettingsPanel({ form, onChange }: FormSettingsPanelProps) {
  const { t } = useTranslation();
  const [closesAtText, setClosesAtText] = useState(form.closesAt === undefined ? '' : formatDateTimeInput(form.closesAt));
  const [closesAtInvalid, setClosesAtInvalid] = useState(false);

  function changeClosesAt(text: string): void {
    setClosesAtText(text);
    const result = parseDateTimeInput(text);
    setClosesAtInvalid(result.status === 'invalid');
    if (result.status === 'ok') onChange({ closesAt: result.date });
    if (result.status === 'empty') onChange({ closesAt: undefined });
  }

  return (
    <Stack gap="lg" testID={testIds.settings.screen}>
      <Text size="xl" weight="bold" heading>{t('settings.title')}</Text>
      <Switch
        label={t('settings.isAcceptingResponses')}
        value={form.isAcceptingResponses}
        onValueChange={(isAcceptingResponses) => onChange({ isAcceptingResponses })}
        testID={testIds.settings.isAcceptingResponses}
      />
      <InputField
        label={t('settings.closesAt')}
        value={closesAtText}
        onChangeText={changeClosesAt}
        placeholder={t('settings.closesAtHint')}
        error={closesAtInvalid ? t('settings.closesAtInvalid') : undefined}
        testID={testIds.settings.closesAt}
      />
      <Switch
        label={t('settings.limitOneResponse')}
        value={form.limitOneResponse}
        onValueChange={(limitOneResponse) => onChange({ limitOneResponse })}
        testID={testIds.settings.limitOneResponse}
      />
      <Switch
        label={t('settings.allowEditAfterSubmit')}
        value={form.allowEditAfterSubmit}
        onValueChange={(allowEditAfterSubmit) => onChange({ allowEditAfterSubmit })}
        testID={testIds.settings.allowEditAfterSubmit}
      />
      <Switch
        label={t('settings.shuffleQuestionOrder')}
        value={form.shuffleQuestionOrder}
        onValueChange={(shuffleQuestionOrder) => onChange({ shuffleQuestionOrder })}
        testID={testIds.settings.shuffleQuestionOrder}
      />
      <Switch
        label={t('settings.showProgressBar')}
        value={form.showProgressBar}
        onValueChange={(showProgressBar) => onChange({ showProgressBar })}
        testID={testIds.settings.showProgressBar}
      />
      <TextArea
        label={t('settings.confirmationMessage')}
        value={form.confirmationMessage ?? ''}
        onChangeText={(text) => onChange({ confirmationMessage: text === '' ? undefined : text })}
        placeholder={t('settings.confirmationHint')}
        autoCapitalize="sentences"
        testID={testIds.settings.confirmationMessage}
      />
    </Stack>
  );
}
