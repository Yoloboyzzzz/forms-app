import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import { LanguageSwitcher } from './LanguageSwitcher';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('LanguageSwitcher', () => {
  it('offers every supported language and marks the current one', () => {
    render(<LanguageSwitcher language="nl" onChange={jest.fn()} />);
    expect(screen.getByTestId(testIdFor.languageOption('nl')).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId(testIdFor.languageOption('en')).props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.getByText('Nederlands')).toBeTruthy();
    expect(screen.getByText('English')).toBeTruthy();
  });

  it('reports the chosen language', () => {
    const onChange = jest.fn();
    render(<LanguageSwitcher language="nl" onChange={onChange} />);
    fireEvent.press(screen.getByTestId(testIdFor.languageOption('en')));
    expect(onChange).toHaveBeenCalledWith('en');
  });
});
