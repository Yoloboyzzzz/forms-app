import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import type { Question } from '@/types/models';
import { QuestionImageEditor, type QuestionImageControls } from './QuestionImageEditor';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const base: Question = {
  id: 'q1',
  formId: 'f1',
  sectionId: 's1',
  title: 'Name',
  isRequired: false,
  orderIndex: 0,
  isActive: true,
  questionType: 'short_answer',
  settings: {},
};

function setup(question: Question = base, overrides: Partial<QuestionImageControls> = {}) {
  const controls: QuestionImageControls = { urls: {}, errors: {}, onPick: jest.fn(), onRemove: jest.fn(), ...overrides };
  render(<QuestionImageEditor question={question} controls={controls} />);
  return controls;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('QuestionImageEditor', () => {
  it('offers to add an image when there is none', () => {
    const controls = setup();
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('q1', 'image')));
    expect(controls.onPick).toHaveBeenCalledWith(base);
    expect(screen.getByText('Add an image')).toBeTruthy();
    expect(screen.queryByTestId(testIdFor.questionAction('q1', 'image-remove'))).toBeNull();
  });

  it('shows the image with change and remove actions', () => {
    const question = { ...base, imagePath: 'f1/q1/p.png' };
    const controls = setup(question, { urls: { 'f1/q1/p.png': 'https://x/p.png' } });
    expect(screen.getByTestId(testIdFor.questionImage('q1')).props.source).toEqual({ uri: 'https://x/p.png' });
    expect(screen.getByText('Change image')).toBeTruthy();
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('q1', 'image-remove')));
    expect(controls.onRemove).toHaveBeenCalledWith(question);
  });

  it('waits for the link before showing the picture', () => {
    setup({ ...base, imagePath: 'f1/q1/p.png' });
    expect(screen.queryByTestId(testIdFor.questionImage('q1'))).toBeNull();
  });

  it('shows an error', () => {
    setup(base, { errors: { q1: 'Nope' } });
    expect(screen.getByTestId(testIdFor.questionAction('q1', 'image-error'))).toHaveTextContent(/Nope/);
  });

  it('disables actions for a deactivated question', () => {
    const controls = setup({ ...base, isActive: false, imagePath: 'x' });
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('q1', 'image')));
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('q1', 'image-remove')));
    expect(controls.onPick).not.toHaveBeenCalled();
    expect(controls.onRemove).not.toHaveBeenCalled();
  });

  it('blocks removing while busy', () => {
    const controls = setup({ ...base, imagePath: 'x' }, { busyQuestionId: 'q1' });
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('q1', 'image-remove')));
    expect(controls.onRemove).not.toHaveBeenCalled();
  });
});
