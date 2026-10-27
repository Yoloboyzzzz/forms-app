import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor, testIds } from '@/constants/testIds';
import { CORE_QUESTION_TYPES } from '@/types/enums';
import { QuestionTypePicker } from './QuestionTypePicker';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('QuestionTypePicker', () => {
  it('offers every core type by default', () => {
    render(<QuestionTypePicker visible onPick={jest.fn()} onClose={jest.fn()} />);
    CORE_QUESTION_TYPES.forEach((type) => expect(screen.getByTestId(testIdFor.questionTypeOption(type))).toBeTruthy());
    expect(screen.getByText('Multiple choice')).toBeTruthy();
  });

  it('can offer other types', () => {
    render(<QuestionTypePicker visible types={['rating']} onPick={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByTestId(testIdFor.questionTypeOption('rating'))).toBeTruthy();
    expect(screen.queryByTestId(testIdFor.questionTypeOption('date'))).toBeNull();
  });

  it('reports the chosen type', () => {
    const onPick = jest.fn();
    render(<QuestionTypePicker visible onPick={onPick} onClose={jest.fn()} />);
    fireEvent.press(screen.getByTestId(testIdFor.questionTypeOption('dropdown')));
    expect(onPick).toHaveBeenCalledWith('dropdown');
  });

  it('closes from the backdrop', () => {
    const onClose = jest.fn();
    render(<QuestionTypePicker visible onPick={jest.fn()} onClose={onClose} />);
    fireEvent.press(screen.getByLabelText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when hidden', () => {
    render(<QuestionTypePicker visible={false} onPick={jest.fn()} onClose={jest.fn()} />);
    expect(screen.queryByTestId(testIds.editor.typePicker)).toBeNull();
  });
});
