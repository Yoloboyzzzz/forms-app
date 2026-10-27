import type { ChoiceOption } from '@/types/models';
import { seedFrom, shuffleWithSeed } from './shuffle';

interface ChoiceQuestionLike {
  id: string;
  options: ChoiceOption[];
  settings: { shuffleOptions?: boolean };
}

/**
 * The options in the order the respondent sees them. With "shuffle options" the order is random but
 * stable for the question, so it does not jump around when the screen redraws. "Other" is always last
 * and is not part of this list.
 */
export function orderedOptions(question: ChoiceQuestionLike): ChoiceOption[] {
  return question.settings.shuffleOptions === true
    ? shuffleWithSeed(question.options, seedFrom(question.id))
    : question.options;
}
