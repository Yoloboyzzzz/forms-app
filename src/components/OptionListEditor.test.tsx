import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import type { ChoiceOption } from '@/types/models';
import { OptionListEditor } from './OptionListEditor';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));
jest.mock('@/hooks/useNewId', () => ({ useNewId: () => () => 'new-id' }));

const options: ChoiceOption[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
];

function setup(list: ChoiceOption[] = options, jumpTargets?: { id: string; label: string }[]) {
  const onChange = jest.fn();
  render(<OptionListEditor questionId="q1" options={list} onChange={onChange} jumpTargets={jumpTargets} />);
  return { onChange };
}

const action = (optionId: string, name: string) => testIdFor.optionAction('q1', optionId, name);

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('OptionListEditor', () => {
  it('shows every option label', () => {
    setup();
    expect(screen.getByTestId(testIdFor.option('q1', 'a')).props.value).toBe('Alpha');
    expect(screen.getByTestId(testIdFor.option('q1', 'c')).props.value).toBe('Gamma');
  });

  it('edits one label', () => {
    const { onChange } = setup();
    fireEvent.changeText(screen.getByTestId(testIdFor.option('q1', 'b')), 'Bravo');
    expect(onChange).toHaveBeenCalledWith([options[0], { id: 'b', label: 'Bravo' }, options[2]]);
  });

  it('adds a numbered option with a stable id', () => {
    const { onChange } = setup();
    fireEvent.press(screen.getByTestId(testIdFor.optionAdd('q1')));
    expect(onChange).toHaveBeenCalledWith([...options, { id: 'new-id', label: 'Option 4' }]);
  });

  it('removes an option', () => {
    const { onChange } = setup();
    fireEvent.press(screen.getByTestId(action('b', 'remove')));
    expect(onChange).toHaveBeenCalledWith([options[0], options[2]]);
  });

  it('never removes the last option', () => {
    const { onChange } = setup([options[0]]);
    fireEvent.press(screen.getByTestId(action('a', 'remove')));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('moves options up and down', () => {
    const { onChange } = setup();
    fireEvent.press(screen.getByTestId(action('b', 'move-up')));
    expect(onChange).toHaveBeenLastCalledWith([options[1], options[0], options[2]]);
    fireEvent.press(screen.getByTestId(action('b', 'move-down')));
    expect(onChange).toHaveBeenLastCalledWith([options[0], options[2], options[1]]);
  });

  it('cannot move past the edges', () => {
    const { onChange } = setup();
    fireEvent.press(screen.getByTestId(action('a', 'move-up')));
    fireEvent.press(screen.getByTestId(action('c', 'move-down')));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('OptionListEditor jumps', () => {
  const targets = [{ id: 's2', label: 'Extra' }];
  const jump = (optionId: string) => testIdFor.optionJump('q1', optionId);

  it('offers no jumps unless targets are given', () => {
    setup();
    expect(screen.queryByTestId(jump('a'))).toBeNull();
  });

  it('shows where each option leads', () => {
    setup([{ id: 'a', label: 'Alpha', goTo: 's2' }, { id: 'b', label: 'Beta', goTo: 'submit' }, { id: 'c', label: 'Gamma' }], targets);
    expect(screen.getByTestId(jump('a')).props.accessibilityValue).toEqual({ text: 'Go to Extra' });
    expect(screen.getByTestId(jump('b')).props.accessibilityValue).toEqual({ text: 'Submit the form' });
    expect(screen.getByTestId(jump('c')).props.accessibilityValue).toEqual({ text: 'Continue to the next section' });
  });

  it('sets a jump to a section, to submit, and back to continue', () => {
    const { onChange } = setup(options, targets);
    fireEvent.press(screen.getByTestId(jump('b')));
    fireEvent.press(screen.getByTestId(`${jump('b')}-option-s2`));
    expect(onChange).toHaveBeenLastCalledWith([options[0], { id: 'b', label: 'Beta', goTo: 's2' }, options[2]]);
    fireEvent.press(screen.getByTestId(jump('b')));
    fireEvent.press(screen.getByTestId(`${jump('b')}-option-submit`));
    expect(onChange).toHaveBeenLastCalledWith([options[0], { id: 'b', label: 'Beta', goTo: 'submit' }, options[2]]);
    fireEvent.press(screen.getByTestId(jump('b')));
    fireEvent.press(screen.getByTestId(`${jump('b')}-option-continue`));
    expect(onChange).toHaveBeenLastCalledWith([options[0], { id: 'b', label: 'Beta', goTo: undefined }, options[2]]);
  });
});
