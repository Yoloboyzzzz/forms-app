import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import type { LinearScaleSettings } from '@/types/models';
import { ScaleEditor } from './ScaleEditor';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const id = (part: string) => testIdFor.scale('q1', part);

function setup(settings: LinearScaleSettings = {}) {
  const onChange = jest.fn();
  render(<ScaleEditor questionId="q1" settings={settings} onChange={onChange} />);
  return { onChange };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('ScaleEditor', () => {
  it('defaults to a scale from 1 to 5', () => {
    setup();
    expect(screen.getByTestId(id('min')).props.accessibilityValue).toEqual({ text: '1' });
    expect(screen.getByTestId(id('max')).props.accessibilityValue).toEqual({ text: '5' });
  });

  it('shows the stored range', () => {
    setup({ min: 0, max: 10 });
    expect(screen.getByTestId(id('min')).props.accessibilityValue).toEqual({ text: '0' });
    expect(screen.getByTestId(id('max')).props.accessibilityValue).toEqual({ text: '10' });
  });

  it('changes the lowest and highest value', () => {
    const { onChange } = setup({ min: 1, max: 5 });
    fireEvent.press(screen.getByTestId(id('min')));
    fireEvent.press(screen.getByTestId(`${id('min')}-option-0`));
    expect(onChange).toHaveBeenLastCalledWith({ min: 0, max: 5 });
    fireEvent.press(screen.getByTestId(id('max')));
    fireEvent.press(screen.getByTestId(`${id('max')}-option-7`));
    expect(onChange).toHaveBeenLastCalledWith({ min: 1, max: 7 });
  });

  it('can go back to a lowest value of 1', () => {
    const { onChange } = setup({ min: 0, max: 5 });
    fireEvent.press(screen.getByTestId(id('min')));
    fireEvent.press(screen.getByTestId(`${id('min')}-option-1`));
    expect(onChange).toHaveBeenCalledWith({ min: 1, max: 5 });
  });

  it('sets and clears the end labels', () => {
    const { onChange } = setup({ min: 1, max: 5 });
    fireEvent.changeText(screen.getByTestId(id('min-label')), 'Bad');
    expect(onChange).toHaveBeenLastCalledWith({ min: 1, max: 5, minLabel: 'Bad' });
    fireEvent.changeText(screen.getByTestId(id('max-label')), 'Great');
    expect(onChange).toHaveBeenLastCalledWith({ min: 1, max: 5, maxLabel: 'Great' });
    fireEvent.changeText(screen.getByTestId(id('max-label')), '');
    expect(onChange).toHaveBeenLastCalledWith({ min: 1, max: 5, maxLabel: undefined });
    fireEvent.changeText(screen.getByTestId(id('min-label')), '');
    expect(onChange).toHaveBeenLastCalledWith({ min: 1, max: 5, minLabel: undefined });
  });
});
