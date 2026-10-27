import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import { SUPPORTED_LANGUAGES, type Language } from '@/i18n';
import { Radio, Stack } from './primitives';

interface LanguageSwitcherProps {
  language: Language;
  onChange: (language: Language) => void;
}

/** One option per supported language; adding a locale file adds an option (with its `language.<code>` label). */
export function LanguageSwitcher({ language, onChange }: LanguageSwitcherProps) {
  const { t } = useTranslation();

  return (
    <Stack>
      {SUPPORTED_LANGUAGES.map((code) => (
        <Radio
          key={code}
          label={t(`language.${code}`)}
          value={code}
          selected={code === language}
          onSelect={() => onChange(code)}
          testID={testIdFor.languageOption(code)}
        />
      ))}
    </Stack>
  );
}
