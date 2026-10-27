import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import { makeQuestion } from '@/testUtils/factories';
import type { AnswerValue, Question } from '@/types/models';
import { QuestionFrame } from './QuestionFrame';
import { QuestionRenderer } from './QuestionRenderer';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const options = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
];

function setup(question: Question, value?: AnswerValue, errorText?: string) {
  const onChange = jest.fn();
  render(<QuestionRenderer question={question} value={value} onChange={onChange} errorText={errorText} />);
  return { onChange };
}

const input = (id = 'q1') => testIdFor.questionInput(id);
const option = (optionId: string, id = 'q1') => testIdFor.questionOption(id, optionId);

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('QuestionFrame', () => {
  it('shows title, description and a required mark', () => {
    setup(makeQuestion('q1', { title: 'Your name', description: 'Full name please', isRequired: true }));
    expect(screen.getByText('Your name')).toBeTruthy();
    expect(screen.getByText('Full name please')).toBeTruthy();
    expect(screen.getByLabelText('required')).toBeTruthy();
  });

  it('shows no mark for optional questions and no description when empty', () => {
    setup(makeQuestion('q1', { description: '' }));
    expect(screen.queryByLabelText('required')).toBeNull();
  });

  it('shows the error under the answer', () => {
    setup(makeQuestion('q1'), undefined, 'This question is required.');
    expect(screen.getByTestId(testIdFor.questionError('q1'))).toHaveTextContent('This question is required.');
  });

  it('renders children inside the frame', () => {
    render(<QuestionFrame question={makeQuestion('q1')}>{null}</QuestionFrame>);
    expect(screen.getByTestId(testIdFor.question('q1'))).toBeTruthy();
  });
});

describe('short answer and paragraph', () => {
  it.each(['short_answer', 'paragraph'] as const)('%s reports typed text and clearing', (type) => {
    const { onChange } = setup(makeQuestion('q1', { questionType: type }), 'old');
    expect(screen.getByTestId(input()).props.value).toBe('old');
    fireEvent.changeText(screen.getByTestId(input()), 'new');
    expect(onChange).toHaveBeenLastCalledWith('new');
    fireEvent.changeText(screen.getByTestId(input()), '');
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('paragraph is a multiline input', () => {
    setup(makeQuestion('q1', { questionType: 'paragraph' }));
    expect(screen.getByTestId(input()).props.multiline).toBe(true);
  });

  it('starts empty without an answer', () => {
    setup(makeQuestion('q1'));
    expect(screen.getByTestId(input()).props.value).toBe('');
  });
});

describe('multiple choice', () => {
  const question = (extra = {}) =>
    makeQuestion('q1', { questionType: 'multiple_choice', options, settings: {}, ...extra });

  it('picks an option', () => {
    const { onChange } = setup(question(), { optionId: 'a' });
    expect(screen.getByTestId(option('a')).props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(screen.getByTestId(option('b')));
    expect(onChange).toHaveBeenCalledWith({ optionId: 'b' });
  });

  it('offers other only when allowed', () => {
    setup(question());
    expect(screen.queryByTestId(testIdFor.questionOtherOption('q1'))).toBeNull();
  });

  it('picks other and types a text', () => {
    const { onChange } = setup(question({ settings: { hasOtherOption: true } }));
    fireEvent.press(screen.getByTestId(testIdFor.questionOtherOption('q1')));
    expect(onChange).toHaveBeenCalledWith({ other: '' });
  });

  it('shows and edits the other text', () => {
    const { onChange } = setup(question({ settings: { hasOtherOption: true } }), { other: 'Delta' });
    expect(screen.getByTestId(testIdFor.questionOtherOption('q1')).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId(testIdFor.questionOther('q1')).props.value).toBe('Delta');
    fireEvent.changeText(screen.getByTestId(testIdFor.questionOther('q1')), 'Delta 2');
    expect(onChange).toHaveBeenCalledWith({ other: 'Delta 2' });
  });

  it('keeps the other text when it is picked again', () => {
    const { onChange } = setup(question({ settings: { hasOtherOption: true } }), { other: 'Delta' });
    fireEvent.press(screen.getByTestId(testIdFor.questionOtherOption('q1')));
    expect(onChange).toHaveBeenCalledWith({ other: 'Delta' });
  });

  it('lets the respondent clear an optional question, but not a required one', () => {
    const { onChange } = setup(question(), { optionId: 'a' });
    fireEvent.press(screen.getByTestId(testIdFor.questionClear('q1')));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('has no clear button when required or unanswered', () => {
    setup(question({ isRequired: true }), { optionId: 'a' });
    expect(screen.queryByTestId(testIdFor.questionClear('q1'))).toBeNull();
  });

  it('has no clear button when unanswered', () => {
    setup(question());
    expect(screen.queryByTestId(testIdFor.questionClear('q1'))).toBeNull();
  });
});

describe('checkboxes', () => {
  const question = (extra = {}) => makeQuestion('q1', { questionType: 'checkboxes', options, settings: {}, ...extra });

  it('ticks and unticks options', () => {
    const { onChange } = setup(question(), { optionIds: ['a'] });
    expect(screen.getByTestId(option('a')).props.accessibilityState).toMatchObject({ checked: true });
    fireEvent.press(screen.getByTestId(option('b')));
    expect(onChange).toHaveBeenLastCalledWith({ optionIds: ['a', 'b'], other: undefined });
    fireEvent.press(screen.getByTestId(option('a')));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('starts with nothing ticked', () => {
    const { onChange } = setup(question());
    fireEvent.press(screen.getByTestId(option('c')));
    expect(onChange).toHaveBeenCalledWith({ optionIds: ['c'], other: undefined });
  });

  it('adds an other text', () => {
    const { onChange } = setup(question({ settings: { hasOtherOption: true } }), { optionIds: ['a'] });
    fireEvent.press(screen.getByTestId(testIdFor.questionOtherOption('q1')));
    expect(onChange).toHaveBeenLastCalledWith({ optionIds: ['a'], other: '' });
  });

  it('edits the other text and keeps the ticked options', () => {
    const { onChange } = setup(question({ settings: { hasOtherOption: true } }), { optionIds: ['a'], other: 'x' });
    fireEvent.changeText(screen.getByTestId(testIdFor.questionOther('q1')), 'xy');
    expect(onChange).toHaveBeenLastCalledWith({ optionIds: ['a'], other: 'xy' });
  });

  it('unticking other removes its text, and an empty answer is cleared', () => {
    const { onChange } = setup(question({ settings: { hasOtherOption: true } }), { optionIds: [], other: 'x' });
    fireEvent.press(screen.getByTestId(testIdFor.questionOtherOption('q1')));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('offers other only when allowed', () => {
    setup(question());
    expect(screen.queryByTestId(testIdFor.questionOtherOption('q1'))).toBeNull();
  });
});

describe('dropdown', () => {
  const question = makeQuestion('q1', { questionType: 'dropdown', options, settings: {} });

  it('shows a placeholder, then the picked option', () => {
    setup(question);
    expect(screen.getByText('Choose')).toBeTruthy();
  });

  it('shows the answer', () => {
    setup(question, { optionId: 'b' });
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('picks an option', () => {
    const { onChange } = setup(question);
    fireEvent.press(screen.getByTestId(input()));
    fireEvent.press(screen.getByTestId(`${input()}-option-c`));
    expect(onChange).toHaveBeenCalledWith({ optionId: 'c' });
  });
});

describe('linear scale', () => {
  const question = (settings = {}) => makeQuestion('q1', { questionType: 'linear_scale', settings });

  it('shows one button per number and selects the answer', () => {
    const { onChange } = setup(question({ min: 1, max: 5 }), 4);
    [1, 2, 3, 4, 5].forEach((n) => expect(screen.getByTestId(testIdFor.questionScaleValue('q1', n))).toBeTruthy());
    expect(screen.queryByTestId(testIdFor.questionScaleValue('q1', 6))).toBeNull();
    fireEvent.press(screen.getByTestId(testIdFor.questionScaleValue('q1', 2)));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('can start at zero', () => {
    setup(question({ min: 0, max: 3 }));
    expect(screen.getByTestId(testIdFor.questionScaleValue('q1', 0))).toBeTruthy();
  });

  it('defaults to 1 to 5', () => {
    setup(question());
    expect(screen.getByTestId(testIdFor.questionScaleValue('q1', 5))).toBeTruthy();
    expect(screen.queryByTestId(testIdFor.questionScaleValue('q1', 0))).toBeNull();
  });

  it('shows the end labels', () => {
    setup(question({ minLabel: 'Bad', maxLabel: 'Great' }));
    expect(screen.getByText('Bad')).toBeTruthy();
    expect(screen.getByText('Great')).toBeTruthy();
  });

  it('shows one label alone', () => {
    setup(question({ maxLabel: 'Great' }));
    expect(screen.getByText('Great')).toBeTruthy();
  });

  it('shows no labels when there are none', () => {
    setup(question());
    expect(screen.queryByText('Great')).toBeNull();
  });
});

describe('date', () => {
  const question = (settings = {}) => makeQuestion('q1', { questionType: 'date', settings });

  it('reports a valid date as the stored value', () => {
    const { onChange } = setup(question());
    fireEvent.changeText(screen.getByTestId(input()), '2026-10-27');
    expect(onChange).toHaveBeenCalledWith('2026-10-27');
  });

  it('reports a date with time', () => {
    const { onChange } = setup(question({ includeTime: true }));
    expect(screen.getByTestId(input()).props.placeholder).toBe('YYYY-MM-DD HH:mm');
    fireEvent.changeText(screen.getByTestId(input()), '2026-10-27 14:30');
    expect(onChange).toHaveBeenCalledWith('2026-10-27T14:30');
  });

  it('shows a stored value in the input pattern', () => {
    setup(question({ includeTime: true }), '2026-10-27T14:30');
    expect(screen.getByTestId(input()).props.value).toBe('2026-10-27 14:30');
  });

  it('explains an invalid date and does not report it', () => {
    const { onChange } = setup(question());
    fireEvent.changeText(screen.getByTestId(input()), '2026-02-31');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId(`${input()}-error`)).toHaveTextContent('Enter a valid date in the format YYYY-MM-DD.');
  });

  it('clears the answer when the field is emptied', () => {
    const { onChange } = setup(question(), '2026-10-27');
    fireEvent.changeText(screen.getByTestId(input()), '');
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('removes the error once the date is valid', () => {
    setup(question());
    fireEvent.changeText(screen.getByTestId(input()), 'nope');
    fireEvent.changeText(screen.getByTestId(input()), '2026-10-27');
    expect(screen.queryByTestId(`${input()}-error`)).toBeNull();
  });
});

describe('rating', () => {
  const question = (settings = {}) => makeQuestion('q1', { questionType: 'rating', settings });
  const rating = (n: number) => testIdFor.questionRatingValue('q1', n);

  it('shows five icons by default and fills up to the rating', () => {
    setup(question(), 3);
    [1, 2, 3, 4, 5].forEach((n) => expect(screen.getByTestId(rating(n))).toBeTruthy());
    expect(screen.queryByTestId(rating(6))).toBeNull();
    expect(screen.getAllByText('star', { includeHiddenElements: true })).toHaveLength(3);
    expect(screen.getAllByText('star-outline', { includeHiddenElements: true })).toHaveLength(2);
  });

  it('uses the configured number and icon', () => {
    setup(question({ max: 3, icon: 'heart' }), 1);
    expect(screen.queryByTestId(rating(4))).toBeNull();
    expect(screen.getAllByText('heart', { includeHiddenElements: true })).toHaveLength(1);
    expect(screen.getAllByText('heart-outline', { includeHiddenElements: true })).toHaveLength(2);
  });

  it('can use thumbs', () => {
    setup(question({ icon: 'thumb' }), 5);
    expect(screen.getAllByText('thumbs-up', { includeHiddenElements: true })).toHaveLength(5);
  });

  it('reports the chosen rating and clears it when pressed again', () => {
    const { onChange } = setup(question(), 2);
    fireEvent.press(screen.getByTestId(rating(4)));
    expect(onChange).toHaveBeenLastCalledWith(4);
    fireEvent.press(screen.getByTestId(rating(2)));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('labels each icon for screen readers', () => {
    setup(question({ max: 3 }));
    expect(screen.getByLabelText('2 of 3')).toBeTruthy();
  });
});

describe('time', () => {
  const question = (settings = {}) => makeQuestion('q1', { questionType: 'time', settings });

  it('reports a valid time', () => {
    const { onChange } = setup(question());
    fireEvent.changeText(screen.getByTestId(input()), '9:05');
    expect(onChange).toHaveBeenCalledWith('09:05');
  });

  it('asks for hours, minutes and seconds for a duration', () => {
    const { onChange } = setup(question({ isDuration: true }));
    expect(screen.getByTestId(input()).props.placeholder).toBe('HH:mm:ss');
    fireEvent.changeText(screen.getByTestId(input()), '1:15:00');
    expect(onChange).toHaveBeenCalledWith('01:15:00');
  });

  it('shows a stored value', () => {
    setup(question(), '14:30');
    expect(screen.getByTestId(input()).props.value).toBe('14:30');
  });

  it('explains an invalid time and does not report it', () => {
    const { onChange } = setup(question());
    fireEvent.changeText(screen.getByTestId(input()), '25:00');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId(`${input()}-error`)).toHaveTextContent('Enter a valid time in the format HH:mm.');
  });

  it('clears the answer when emptied, and the error once valid', () => {
    const { onChange } = setup(question(), '14:30');
    fireEvent.changeText(screen.getByTestId(input()), 'x');
    fireEvent.changeText(screen.getByTestId(input()), '');
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(screen.queryByTestId(`${input()}-error`)).toBeNull();
  });
});

describe('QuestionRenderer', () => {
  it.each([makeQuestion('q1', { questionType: 'file_upload', settings: {} })])('shows nothing for the not yet supported $questionType type', (question) => {
    const { toJSON } = render(<QuestionRenderer question={question} value={undefined} onChange={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });

  it('shows nothing for grid questions', () => {
    const grid = makeQuestion('q1', { questionType: 'multiple_choice_grid', options: { rows: [], columns: [] }, settings: {} });
    const { toJSON } = render(<QuestionRenderer question={grid} value={undefined} onChange={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });
});
