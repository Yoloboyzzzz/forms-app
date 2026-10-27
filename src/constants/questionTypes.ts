import type Ionicons from '@expo/vector-icons/Ionicons';
import type { QuestionType } from '@/types/enums';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Icon shown next to each question type in pickers and editors. */
export const QUESTION_TYPE_ICONS: Record<QuestionType, IconName> = {
  short_answer: 'text',
  paragraph: 'reorder-four',
  multiple_choice: 'radio-button-on',
  checkboxes: 'checkbox',
  dropdown: 'chevron-down-circle',
  linear_scale: 'options',
  rating: 'star',
  multiple_choice_grid: 'grid',
  checkbox_grid: 'apps',
  date: 'calendar',
  time: 'time',
  file_upload: 'cloud-upload',
};
