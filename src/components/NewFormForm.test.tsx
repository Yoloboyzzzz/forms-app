import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIds } from '@/constants/testIds';
import { NewFormForm } from './NewFormForm';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const ids = testIds.newForm;

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('NewFormForm', () => {
  it('submits the trimmed title and description', () => {
    const onSubmit = jest.fn();
    render(<NewFormForm onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByTestId(ids.titleInput), ' Feedback ');
    fireEvent.changeText(screen.getByTestId(ids.descriptionInput), ' About us ');
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).toHaveBeenCalledWith({ title: 'Feedback', description: 'About us' });
  });

  it('leaves out an empty description', () => {
    const onSubmit = jest.fn();
    render(<NewFormForm onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByTestId(ids.titleInput), 'Feedback');
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).toHaveBeenCalledWith({ title: 'Feedback', description: undefined });
  });

  it('requires a title', () => {
    const onSubmit = jest.fn();
    render(<NewFormForm onSubmit={onSubmit} />);
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId(`${ids.titleInput}-error`)).toHaveTextContent('This field is required.');
  });

  it('shows a server error', () => {
    render(<NewFormForm onSubmit={jest.fn()} errorKey="errors.forbidden" />);
    expect(screen.getByTestId(ids.errorText)).toHaveTextContent('You do not have access to this.');
  });

  it('blocks submitting while loading', () => {
    const onSubmit = jest.fn();
    render(<NewFormForm onSubmit={onSubmit} isLoading />);
    fireEvent.changeText(screen.getByTestId(ids.titleInput), 'Feedback');
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
