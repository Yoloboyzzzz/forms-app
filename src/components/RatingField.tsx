import { useTranslation } from 'react-i18next';
import { testIdFor } from '@/constants/testIds';
import type { AnswerValue, RatingQuestion } from '@/types/models';
import { readNumber } from '@/utils/answers';
import { QuestionFrame } from './QuestionFrame';
import { IconButton, Row } from './primitives';

type RatingIconName = Parameters<typeof IconButton>[0]['icon'];

const ICONS: Record<'star' | 'heart' | 'thumb', { filled: RatingIconName; outline: RatingIconName }> = {
  star: { filled: 'star', outline: 'star-outline' },
  heart: { filled: 'heart', outline: 'heart-outline' },
  thumb: { filled: 'thumbs-up', outline: 'thumbs-up-outline' },
};

interface RatingFieldProps {
  question: RatingQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue | undefined) => void;
  errorText?: string;
}

/** Rate with 3 to 10 icons. Pressing the chosen icon again clears the rating. */
export function RatingField({ question, value, onChange, errorText }: RatingFieldProps) {
  const { t } = useTranslation();
  const max = question.settings.max ?? 5;
  const icons = ICONS[question.settings.icon ?? 'star'];
  const rating = readNumber(value) ?? 0;

  return (
    <QuestionFrame question={question} errorText={errorText}>
      <Row wrap>
        {Array.from({ length: max }, (_, index) => index + 1).map((n) => (
          <IconButton
            key={n}
            icon={n <= rating ? icons.filled : icons.outline}
            color={n <= rating ? 'primary' : 'muted'}
            label={t('fill.ratingValue', { value: n, max })}
            onPress={() => onChange(n === rating ? undefined : n)}
            testID={testIdFor.questionRatingValue(question.id, n)}
          />
        ))}
      </Row>
    </QuestionFrame>
  );
}
