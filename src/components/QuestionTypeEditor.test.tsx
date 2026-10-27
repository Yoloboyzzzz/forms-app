import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import { makeQuestion } from '@/testUtils/factories';
import type { Question } from '@/types/models';
import { QuestionTypeEditor } from './QuestionTypeEditor';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));
jest.mock('@/hooks/useNewId', () => ({ useNewId: () => () => 'new-id' }));

const options = [{ id: 'o1', label: 'One' }];

function setup(question: Question, sections?: { id: string; label: string }[]) {
  const onChange = jest.fn();
  render(<QuestionTypeEditor question={question} onChange={onChange} sections={sections} />);
  return { onChange };
}

const setting = (name: string) => testIdFor.setting('q1', name);
const toggle = (testID: string, value: boolean) => fireEvent(screen.getByTestId(testID), 'valueChange', value);

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('QuestionTypeEditor', () => {
  it.each(['short_answer', 'paragraph'] as const)('offers validation for %s questions', (type) => {
    const question = makeQuestion('q1', { questionType: type });
    const { onChange } = setup(question);
    toggle(testIdFor.validation('q1', 'switch'), true);
    expect(onChange).toHaveBeenCalledWith({
      ...question,
      settings: { validation: expect.objectContaining({ kind: type === 'short_answer' ? 'number' : 'length' }) },
    });
  });

  it('removes validation again', () => {
    const question = makeQuestion('q1', { settings: { validation: { kind: 'text', operator: 'isEmail' } } });
    const { onChange } = setup(question);
    toggle(testIdFor.validation('q1', 'switch'), false);
    expect(onChange).toHaveBeenCalledWith({ ...question, settings: { validation: undefined } });
  });

  describe('multiple choice', () => {
    const question = makeQuestion('q1', { questionType: 'multiple_choice', options, settings: {} });

    it('edits the options', () => {
      const { onChange } = setup(question);
      fireEvent.changeText(screen.getByTestId(testIdFor.option('q1', 'o1')), 'Uno');
      expect(onChange).toHaveBeenCalledWith({ ...question, options: [{ id: 'o1', label: 'Uno' }] });
    });

    it('toggles the other option and shuffling', () => {
      const { onChange } = setup(question);
      toggle(setting('other'), true);
      expect(onChange).toHaveBeenLastCalledWith({ ...question, settings: { hasOtherOption: true } });
      toggle(setting('shuffle'), true);
      expect(onChange).toHaveBeenLastCalledWith({ ...question, settings: { shuffleOptions: true } });
    });

    it('does not offer validation', () => {
      setup(question);
      expect(screen.queryByTestId(testIdFor.validation('q1', 'switch'))).toBeNull();
    });
  });

  describe.each(['multiple_choice', 'dropdown'] as const)('%s branching', (type) => {
    const sections = [{ id: 's1', label: 'Section 1' }, { id: 's2', label: 'Extra' }];
    const question = makeQuestion('q1', { questionType: type, options, settings: {} });

    it('switches branching on', () => {
      const { onChange } = setup(question, sections);
      toggle(setting('branching'), true);
      expect(onChange).toHaveBeenCalledWith({ ...question, settings: { goToSectionBasedOnAnswer: true } });
    });

    it('shows jump choices only while branching is on, never to its own section', () => {
      const { onChange } = setup({ ...question, settings: { goToSectionBasedOnAnswer: true } } as Question, sections); // same type, only the setting differs
      fireEvent.press(screen.getByTestId(testIdFor.optionJump('q1', 'o1')));
      expect(screen.getByTestId(`${testIdFor.optionJump('q1', 'o1')}-option-s2`)).toBeTruthy();
      expect(screen.queryByTestId(`${testIdFor.optionJump('q1', 'o1')}-option-s1`)).toBeNull();
      fireEvent.press(screen.getByTestId(`${testIdFor.optionJump('q1', 'o1')}-option-s2`));
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ options: [{ id: 'o1', label: 'One', goTo: 's2' }] }));
    });

    it('hides jump choices while branching is off', () => {
      setup(question, sections);
      expect(screen.queryByTestId(testIdFor.optionJump('q1', 'o1'))).toBeNull();
    });
  });

  describe('checkboxes', () => {
    const question = makeQuestion('q1', { questionType: 'checkboxes', options, settings: {} });

    it('edits options and both toggles', () => {
      const { onChange } = setup(question);
      fireEvent.press(screen.getByTestId(testIdFor.optionAdd('q1')));
      expect(onChange).toHaveBeenLastCalledWith({ ...question, options: [...options, { id: 'new-id', label: 'Option 2' }] });
      toggle(setting('other'), true);
      expect(onChange).toHaveBeenLastCalledWith({ ...question, settings: { hasOtherOption: true } });
      toggle(setting('shuffle'), true);
      expect(onChange).toHaveBeenLastCalledWith({ ...question, settings: { shuffleOptions: true } });
    });

    it('offers a selection count rule', () => {
      const { onChange } = setup(question);
      toggle(testIdFor.validation('q1', 'switch'), true);
      expect(onChange).toHaveBeenCalledWith({
        ...question,
        settings: { validation: { kind: 'checkboxCount', operator: 'atLeast', value: 1 } },
      });
    });
  });

  describe('dropdown', () => {
    const question = makeQuestion('q1', { questionType: 'dropdown', options, settings: {} });

    it('edits options and shuffling, without an other option', () => {
      const { onChange } = setup(question);
      expect(screen.queryByTestId(setting('other'))).toBeNull();
      fireEvent.changeText(screen.getByTestId(testIdFor.option('q1', 'o1')), 'Uno');
      expect(onChange).toHaveBeenLastCalledWith({ ...question, options: [{ id: 'o1', label: 'Uno' }] });
      toggle(setting('shuffle'), true);
      expect(onChange).toHaveBeenLastCalledWith({ ...question, settings: { shuffleOptions: true } });
    });
  });

  it('edits the settings of a linear scale', () => {
    const question = makeQuestion('q1', { questionType: 'linear_scale', settings: { min: 1, max: 5 } });
    const { onChange } = setup(question);
    fireEvent.changeText(screen.getByTestId(testIdFor.scale('q1', 'min-label')), 'Low');
    expect(onChange).toHaveBeenCalledWith({ ...question, settings: { min: 1, max: 5, minLabel: 'Low' } });
  });

  it('edits the settings of a date question', () => {
    const question = makeQuestion('q1', { questionType: 'date', settings: {} });
    const { onChange } = setup(question);
    expect(screen.getByTestId(setting('include-year')).props.accessibilityState).toMatchObject({ checked: true });
    toggle(setting('include-year'), false);
    expect(onChange).toHaveBeenLastCalledWith({ ...question, settings: { includeYear: false } });
    toggle(setting('include-time'), true);
    expect(onChange).toHaveBeenLastCalledWith({ ...question, settings: { includeTime: true } });
  });

  it('edits the settings of a rating question', () => {
    const question = makeQuestion('q1', { questionType: 'rating', settings: { max: 5, icon: 'star' } });
    const { onChange } = setup(question);
    fireEvent.press(screen.getByTestId(setting('rating-max')));
    fireEvent.press(screen.getByTestId(`${setting('rating-max')}-option-7`));
    expect(onChange).toHaveBeenLastCalledWith({ ...question, settings: { max: 7, icon: 'star' } });
    fireEvent.press(screen.getByTestId(setting('rating-icon')));
    fireEvent.press(screen.getByTestId(`${setting('rating-icon')}-option-heart`));
    expect(onChange).toHaveBeenLastCalledWith({ ...question, settings: { max: 5, icon: 'heart' } });
  });

  it('shows the default rating settings', () => {
    setup(makeQuestion('q1', { questionType: 'rating', settings: {} }));
    expect(screen.getByTestId(setting('rating-max')).props.accessibilityValue).toEqual({ text: '5' });
    expect(screen.getByTestId(setting('rating-icon')).props.accessibilityValue).toEqual({ text: 'Star' });
  });

  it('lets a time question be a duration', () => {
    const question = makeQuestion('q1', { questionType: 'time', settings: {} });
    const { onChange } = setup(question);
    toggle(setting('duration'), true);
    expect(onChange).toHaveBeenCalledWith({ ...question, settings: { isDuration: true } });
  });

  it.each(['file_upload'] as const)(
    'has no type specific settings yet for %s',
    (type) => {
      const base = makeQuestion('q1', { questionType: 'short_answer' });
      const question: Question = { ...base, questionType: type, settings: {} };
      const { toJSON } = render(<QuestionTypeEditor question={question} onChange={jest.fn()} />);
      expect(toJSON()).toBeNull();
    },
  );
});
