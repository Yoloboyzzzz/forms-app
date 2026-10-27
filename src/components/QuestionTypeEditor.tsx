import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { Question } from '@/types/models';
import { assertNever } from '@/utils/assertNever';
import { VALIDATION_KINDS_BY_QUESTION } from '@/utils/validation';
import { OptionListEditor } from './OptionListEditor';
import { ScaleEditor } from './ScaleEditor';
import { Stack, Switch } from './primitives';
import { ValidationRuleEditor } from './ValidationRuleEditor';

interface QuestionTypeEditorProps {
  question: Question;
  onChange: (question: Question) => void;
}

/** The settings that belong to one question type, below the common fields. */
export function QuestionTypeEditor({ question, onChange }: QuestionTypeEditorProps) {
  const { t } = useTranslation();

  switch (question.questionType) {
    case 'short_answer':
    case 'paragraph':
      return (
        <ValidationRuleEditor
          questionId={question.id}
          rule={question.settings.validation}
          kinds={VALIDATION_KINDS_BY_QUESTION[question.questionType]}
          onChange={(validation) => onChange({ ...question, settings: { ...question.settings, validation } })}
        />
      );
    case 'multiple_choice':
      return (
        <Stack gap="md">
          <OptionListEditor
            questionId={question.id}
            options={question.options}
            onChange={(options) => onChange({ ...question, options })}
          />
          <Switch
            label={t('editor.options.other')}
            value={question.settings.hasOtherOption ?? false}
            onValueChange={(hasOtherOption) => onChange({ ...question, settings: { ...question.settings, hasOtherOption } })}
            testID={testIdFor.setting(question.id, 'other')}
          />
          <Switch
            label={t('editor.options.shuffle')}
            value={question.settings.shuffleOptions ?? false}
            onValueChange={(shuffleOptions) => onChange({ ...question, settings: { ...question.settings, shuffleOptions } })}
            testID={testIdFor.setting(question.id, 'shuffle')}
          />
        </Stack>
      );
    case 'checkboxes':
      return (
        <Stack gap="md">
          <OptionListEditor
            questionId={question.id}
            options={question.options}
            onChange={(options) => onChange({ ...question, options })}
          />
          <Switch
            label={t('editor.options.other')}
            value={question.settings.hasOtherOption ?? false}
            onValueChange={(hasOtherOption) => onChange({ ...question, settings: { ...question.settings, hasOtherOption } })}
            testID={testIdFor.setting(question.id, 'other')}
          />
          <Switch
            label={t('editor.options.shuffle')}
            value={question.settings.shuffleOptions ?? false}
            onValueChange={(shuffleOptions) => onChange({ ...question, settings: { ...question.settings, shuffleOptions } })}
            testID={testIdFor.setting(question.id, 'shuffle')}
          />
          <ValidationRuleEditor
            questionId={question.id}
            rule={question.settings.validation}
            kinds={VALIDATION_KINDS_BY_QUESTION.checkboxes}
            onChange={(validation) => onChange({ ...question, settings: { ...question.settings, validation } })}
          />
        </Stack>
      );
    case 'dropdown':
      return (
        <Stack gap="md">
          <OptionListEditor
            questionId={question.id}
            options={question.options}
            onChange={(options) => onChange({ ...question, options })}
          />
          <Switch
            label={t('editor.options.shuffle')}
            value={question.settings.shuffleOptions ?? false}
            onValueChange={(shuffleOptions) => onChange({ ...question, settings: { ...question.settings, shuffleOptions } })}
            testID={testIdFor.setting(question.id, 'shuffle')}
          />
        </Stack>
      );
    case 'linear_scale':
      return (
        <ScaleEditor
          questionId={question.id}
          settings={question.settings}
          onChange={(settings) => onChange({ ...question, settings })}
        />
      );
    case 'date':
      return (
        <Stack gap="sm">
          <Switch
            label={t('editor.date.includeYear')}
            value={question.settings.includeYear ?? true}
            onValueChange={(includeYear) => onChange({ ...question, settings: { ...question.settings, includeYear } })}
            testID={testIdFor.setting(question.id, 'include-year')}
          />
          <Switch
            label={t('editor.date.includeTime')}
            value={question.settings.includeTime ?? false}
            onValueChange={(includeTime) => onChange({ ...question, settings: { ...question.settings, includeTime } })}
            testID={testIdFor.setting(question.id, 'include-time')}
          />
        </Stack>
      );
    // Editors for these types follow in plan phase 8.
    case 'rating':
    case 'multiple_choice_grid':
    case 'checkbox_grid':
    case 'time':
    case 'file_upload':
      return null;
    default:
      return assertNever(question);
  }
}
