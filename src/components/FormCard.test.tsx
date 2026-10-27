import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import { makeForm } from '@/testUtils/factories';
import { FormCard } from './FormCard';
import { FormStatusBadge } from './FormStatusBadge';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('FormStatusBadge', () => {
  it.each([
    ['draft', 'Draft'],
    ['published', 'Published'],
    ['archived', 'Archived'],
  ] as const)('labels %s', (status, label) => {
    render(<FormStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeTruthy();
  });
});

describe('FormCard', () => {
  it('shows title, description, status and last change', () => {
    render(<FormCard form={makeForm({ description: 'About us' })} onPress={jest.fn()} />);
    expect(screen.getByText('Customer feedback')).toBeTruthy();
    expect(screen.getByText('About us')).toBeTruthy();
    expect(screen.getByText('Draft')).toBeTruthy();
    expect(screen.getByText('Updated on Oct 27, 2026')).toBeTruthy();
  });

  it('formats the date in the active language', async () => {
    await i18n.changeLanguage('nl');
    render(<FormCard form={makeForm()} onPress={jest.fn()} />);
    expect(screen.getByText('Gewijzigd op 27 okt 2026')).toBeTruthy();
  });

  it('falls back to a placeholder title', () => {
    render(<FormCard form={makeForm({ title: '  ' })} onPress={jest.fn()} />);
    expect(screen.getByText('Untitled')).toBeTruthy();
  });

  it('hides an empty description', () => {
    render(<FormCard form={makeForm({ description: '' })} onPress={jest.fn()} />);
    expect(screen.queryByText('About us')).toBeNull();
  });

  it('opens the form it shows', () => {
    const form = makeForm();
    const onPress = jest.fn();
    render(<FormCard form={form} onPress={onPress} />);
    fireEvent.press(screen.getByTestId(testIdFor.formCard('f1')));
    expect(onPress).toHaveBeenCalledWith(form);
  });
});
