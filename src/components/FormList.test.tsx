import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import { makeForm } from '@/testUtils/factories';
import { FormList } from './FormList';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('FormList', () => {
  const forms = [makeForm({ id: 'a', title: 'Alpha' }), makeForm({ id: 'b', title: 'Beta' })];

  it('renders a card per form, keyed by id', () => {
    render(<FormList forms={forms} onPressForm={jest.fn()} />);
    expect(screen.getByTestId(testIdFor.formCard('a'))).toBeTruthy();
    expect(screen.getByTestId(testIdFor.formCard('b'))).toBeTruthy();
  });

  it('reports the pressed form', () => {
    const onPressForm = jest.fn();
    render(<FormList forms={forms} onPressForm={onPressForm} />);
    fireEvent.press(screen.getByTestId(testIdFor.formCard('b')));
    expect(onPressForm).toHaveBeenCalledWith(forms[1]);
  });

  it('supports pull to refresh', () => {
    const onRefresh = jest.fn();
    render(<FormList forms={forms} onPressForm={jest.fn()} onRefresh={onRefresh} isRefreshing testID="list" />);
    const list = screen.getByTestId('list');
    expect(list.props.refreshControl.props.refreshing).toBe(true);
    list.props.refreshControl.props.onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
