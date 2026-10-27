import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import type { ValidationRule } from '@/types/models';
import { ValidationRuleEditor } from './ValidationRuleEditor';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const id = (part: string) => testIdFor.validation('q1', part);

function setup(rule?: ValidationRule, kinds: React.ComponentProps<typeof ValidationRuleEditor>['kinds'] = ['number', 'text', 'length', 'regex']) {
  const onChange = jest.fn();
  render(<ValidationRuleEditor questionId="q1" rule={rule} kinds={kinds} onChange={onChange} />);
  return { onChange };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('ValidationRuleEditor', () => {
  it('is off when there is no rule', () => {
    setup();
    expect(screen.getByTestId(id('switch')).props.accessibilityState).toMatchObject({ checked: false });
    expect(screen.queryByTestId(id('operator'))).toBeNull();
  });

  it('turns on with the first allowed kind', () => {
    const { onChange } = setup(undefined, ['length', 'regex']);
    fireEvent(screen.getByTestId(id('switch')), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith({ kind: 'length', operator: 'max', value: 100 });
  });

  it('turns off by removing the rule', () => {
    const { onChange } = setup({ kind: 'text', operator: 'isEmail' });
    fireEvent(screen.getByTestId(id('switch')), 'valueChange', false);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('changes the kind to a fresh rule', () => {
    const { onChange } = setup({ kind: 'text', operator: 'isEmail' });
    fireEvent.press(screen.getByTestId(id('kind')));
    fireEvent.press(screen.getByTestId(`${id('kind')}-option-regex`));
    expect(onChange).toHaveBeenCalledWith({ kind: 'regex', operator: 'matches', value: '' });
  });

  it('hides the kind picker when only one kind is possible', () => {
    setup({ kind: 'checkboxCount', operator: 'atLeast', value: 1 }, ['checkboxCount']);
    expect(screen.queryByTestId(id('kind'))).toBeNull();
    expect(screen.getByTestId(id('operator'))).toBeTruthy();
  });

  it('changes the condition and keeps the values', () => {
    const { onChange } = setup({ kind: 'number', operator: 'gt', value: 3 });
    fireEvent.press(screen.getByTestId(id('operator')));
    fireEvent.press(screen.getByTestId(`${id('operator')}-option-lte`));
    expect(onChange).toHaveBeenCalledWith({ kind: 'number', operator: 'lte', value: 3 });
  });

  it('edits the value', () => {
    const { onChange } = setup({ kind: 'number', operator: 'gt', value: 3 });
    expect(screen.getByTestId(id('value')).props.value).toBe('3');
    fireEvent.changeText(screen.getByTestId(id('value')), '12');
    expect(onChange).toHaveBeenCalledWith({ kind: 'number', operator: 'gt', value: 12 });
  });

  it('uses a numeric keyboard for number-like values and a text keyboard for text', () => {
    setup({ kind: 'number', operator: 'gt' });
    expect(screen.getByTestId(id('value')).props.keyboardType).toBe('numbers-and-punctuation');
  });

  it('uses the default keyboard for text values', () => {
    setup({ kind: 'text', operator: 'contains', value: 'a' });
    expect(screen.getByTestId(id('value')).props.keyboardType).toBe('default');
  });

  it('asks for an upper value only for between', () => {
    const { onChange } = setup({ kind: 'number', operator: 'between', value: 1 });
    fireEvent.changeText(screen.getByTestId(id('max')), '9');
    expect(onChange).toHaveBeenCalledWith({ kind: 'number', operator: 'between', value: 1, valueMax: 9 });
  });

  it('asks for no value for operators that need none', () => {
    setup({ kind: 'text', operator: 'isEmail' });
    expect(screen.queryByTestId(id('value'))).toBeNull();
    expect(screen.queryByTestId(id('max'))).toBeNull();
  });

  it('sets and clears the custom message', () => {
    const { onChange } = setup({ kind: 'text', operator: 'isEmail' });
    fireEvent.changeText(screen.getByTestId(id('error-message')), 'Use your work email');
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'text', operator: 'isEmail', errorMessage: 'Use your work email' });
    fireEvent.changeText(screen.getByTestId(id('error-message')), '');
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'text', operator: 'isEmail', errorMessage: undefined });
  });
});
