import { testIdFor } from '@/constants/testIds';
import type { AnswerValue, CheckboxGridQuestion, MultipleChoiceGridQuestion } from '@/types/models';
import { readGrid } from '@/utils/answers';
import { seedFrom, shuffleWithSeed } from '@/utils/shuffle';
import { QuestionFrame } from './QuestionFrame';
import { Card, Checkbox, Radio, Stack, Text } from './primitives';

interface ChoiceGridFieldProps {
  question: MultipleChoiceGridQuestion | CheckboxGridQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue | undefined) => void;
  errorText?: string;
}

/**
 * A grid question, one card per row so it stays readable on a phone: pick one column per row (multiple
 * choice grid) or any number of columns per row (checkbox grid).
 */
export function ChoiceGridField({ question, value, onChange, errorText }: ChoiceGridFieldProps) {
  const picked = readGrid(value);
  const isCheckboxGrid = question.questionType === 'checkbox_grid';
  const rows = question.settings.shuffleRows === true
    ? shuffleWithSeed(question.options.rows, seedFrom(question.id))
    : question.options.rows;

  /** Writes the answer for one row; rows without a pick are left out, and no rows at all means no answer. */
  function emit(rowId: string, columns: string[]): void {
    const next: Record<string, string[]> = { ...picked, [rowId]: columns };
    const answered = Object.entries(next).filter(([, ids]) => ids.length > 0);
    if (answered.length === 0) {
      onChange(undefined);
    } else if (isCheckboxGrid) {
      onChange(Object.fromEntries(answered));
    } else {
      onChange(Object.fromEntries(answered.map(([id, ids]) => [id, ids[0]])));
    }
  }

  return (
    <QuestionFrame question={question} errorText={errorText}>
      <Stack gap="md">
        {rows.map((row) => (
          <Card key={row.id}>
            <Stack gap="sm" padding="md">
              <Text weight="medium">{row.label}</Text>
              {question.options.columns.map((column) => {
                const selected = (picked[row.id] ?? []).includes(column.id);
                const testID = testIdFor.gridCell(question.id, row.id, column.id);
                return isCheckboxGrid ? (
                  <Checkbox
                    key={column.id}
                    label={column.label}
                    checked={selected}
                    onChange={(checked) =>
                      emit(row.id, checked ? [...(picked[row.id] ?? []), column.id] : (picked[row.id] ?? []).filter((id) => id !== column.id))
                    }
                    testID={testID}
                  />
                ) : (
                  <Radio
                    key={column.id}
                    label={column.label}
                    value={column.id}
                    selected={selected}
                    onSelect={() => emit(row.id, [column.id])}
                    testID={testID}
                  />
                );
              })}
            </Stack>
          </Card>
        ))}
      </Stack>
    </QuestionFrame>
  );
}
