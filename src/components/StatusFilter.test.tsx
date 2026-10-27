import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import { StatusFilter } from './StatusFilter';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('StatusFilter', () => {
  it('offers all forms and every status', () => {
    render(<StatusFilter value="all" onChange={jest.fn()} />);
    ['all', 'draft', 'published', 'archived'].forEach((option) =>
      expect(screen.getByTestId(testIdFor.formStatusFilter(option))).toBeTruthy(),
    );
  });

  it('highlights the selected option', () => {
    render(<StatusFilter value="published" onChange={jest.fn()} />);
    expect(screen.getByTestId(testIdFor.formStatusFilter('published'))).toHaveStyle({ backgroundColor: '#1d4ed8' });
    expect(screen.getByTestId(testIdFor.formStatusFilter('draft'))).not.toHaveStyle({ backgroundColor: '#1d4ed8' });
  });

  it('reports the chosen option', () => {
    const onChange = jest.fn();
    render(<StatusFilter value="all" onChange={onChange} />);
    fireEvent.press(screen.getByTestId(testIdFor.formStatusFilter('archived')));
    expect(onChange).toHaveBeenCalledWith('archived');
  });
});
