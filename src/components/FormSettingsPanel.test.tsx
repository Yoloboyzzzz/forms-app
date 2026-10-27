import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIds } from '@/constants/testIds';
import { makeForm } from '@/testUtils/factories';
import { FormSettingsPanel } from './FormSettingsPanel';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const ids = testIds.settings;

function setup(overrides: Parameters<typeof makeForm>[0] = {}) {
  const onChange = jest.fn();
  render(<FormSettingsPanel form={makeForm(overrides)} onChange={onChange} />);
  return { onChange };
}

const toggle = (testID: string, value: boolean) => fireEvent(screen.getByTestId(testID), 'valueChange', value);

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('FormSettingsPanel', () => {
  it('shows the current settings', () => {
    setup({ limitOneResponse: false, allowEditAfterSubmit: true, confirmationMessage: 'Thanks!' });
    expect(screen.getByTestId(ids.isAcceptingResponses).props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId(ids.limitOneResponse).props.accessibilityState).toMatchObject({ checked: false });
    expect(screen.getByTestId(ids.allowEditAfterSubmit).props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId(ids.confirmationMessage).props.value).toBe('Thanks!');
  });

  it.each([
    ['isAcceptingResponses', ids.isAcceptingResponses],
    ['limitOneResponse', ids.limitOneResponse],
    ['allowEditAfterSubmit', ids.allowEditAfterSubmit],
    ['shuffleQuestionOrder', ids.shuffleQuestionOrder],
    ['showProgressBar', ids.showProgressBar],
  ])('reports a change of %s', (key, testID) => {
    const { onChange } = setup({
      isAcceptingResponses: true,
      limitOneResponse: true,
      allowEditAfterSubmit: false,
      shuffleQuestionOrder: false,
      showProgressBar: true,
    });
    const current = screen.getByTestId(testID).props.accessibilityState.checked;
    toggle(testID, !current);
    expect(onChange).toHaveBeenCalledWith({ [key]: !current });
  });

  it('sets and clears the confirmation message', () => {
    const { onChange } = setup();
    fireEvent.changeText(screen.getByTestId(ids.confirmationMessage), 'Thanks!');
    expect(onChange).toHaveBeenLastCalledWith({ confirmationMessage: 'Thanks!' });
    fireEvent.changeText(screen.getByTestId(ids.confirmationMessage), '');
    expect(onChange).toHaveBeenLastCalledWith({ confirmationMessage: undefined });
  });

  describe('closing date', () => {
    it('shows an existing date as text', () => {
      setup({ closesAt: new Date(2026, 10, 4, 14, 30) });
      expect(screen.getByTestId(ids.closesAt).props.value).toBe('2026-11-04 14:30');
    });

    it('sets a valid date, and a date alone closes at the end of the day', () => {
      const { onChange } = setup();
      fireEvent.changeText(screen.getByTestId(ids.closesAt), '2026-11-04');
      expect(onChange).toHaveBeenLastCalledWith({ closesAt: new Date(2026, 10, 4, 23, 59) });
      fireEvent.changeText(screen.getByTestId(ids.closesAt), '2026-11-04 08:15');
      expect(onChange).toHaveBeenLastCalledWith({ closesAt: new Date(2026, 10, 4, 8, 15) });
    });

    it('clears the date when the field is emptied', () => {
      const { onChange } = setup({ closesAt: new Date(2026, 10, 4) });
      fireEvent.changeText(screen.getByTestId(ids.closesAt), '');
      expect(onChange).toHaveBeenLastCalledWith({ closesAt: undefined });
    });

    it('explains an invalid date and does not save it', () => {
      const { onChange } = setup();
      fireEvent.changeText(screen.getByTestId(ids.closesAt), '2026-02-31');
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByTestId(`${ids.closesAt}-error`)).toHaveTextContent('Use the format 2026-11-04 or 2026-11-04 14:30.');
    });

    it('removes the error once the date is valid again', () => {
      setup();
      fireEvent.changeText(screen.getByTestId(ids.closesAt), 'nope');
      fireEvent.changeText(screen.getByTestId(ids.closesAt), '2026-11-04');
      expect(screen.queryByTestId(`${ids.closesAt}-error`)).toBeNull();
    });
  });
});
