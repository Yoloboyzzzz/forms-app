import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import { makeQuestion, makeSection } from '@/testUtils/factories';
import { SectionEditor } from './SectionEditor';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const a = makeQuestion('a', { title: 'First' });
const b = makeQuestion('b', { title: 'Second', orderIndex: 1 });

function setup(props: Partial<React.ComponentProps<typeof SectionEditor>> = {}) {
  const questionHandlers = { onChange: jest.fn(), onMove: jest.fn(), onDuplicate: jest.fn(), onDelete: jest.fn() };
  const onAddQuestion = jest.fn();
  render(
    <SectionEditor
      section={makeSection('s1')}
      position={1}
      questions={[a, b]}
      questionHandlers={questionHandlers}
      onAddQuestion={onAddQuestion}
      {...props}
    />,
  );
  return { questionHandlers, onAddQuestion };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('SectionEditor', () => {
  it('names an untitled section by its position', () => {
    setup({ position: 2 });
    expect(screen.getByText('Section 2')).toBeTruthy();
  });

  it('shows the section title when it has one', () => {
    setup({ section: makeSection('s1', 0, { title: 'About you' }) });
    expect(screen.getByText('About you')).toBeTruthy();
  });

  it('renders every question', () => {
    setup();
    expect(screen.getByTestId(testIdFor.question('a'))).toBeTruthy();
    expect(screen.getByTestId(testIdFor.question('b'))).toBeTruthy();
  });

  it('explains an empty section', () => {
    setup({ questions: [] });
    expect(screen.getByText('This section has no questions yet.')).toBeTruthy();
  });

  it('adds a question to this section', () => {
    const { onAddQuestion } = setup();
    fireEvent.press(screen.getByTestId(testIdFor.addQuestionButton('s1')));
    expect(onAddQuestion).toHaveBeenCalledWith('s1');
  });

  it('only allows moving where there is room', () => {
    const { questionHandlers } = setup();
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('a', 'move-up')));
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('b', 'move-down')));
    expect(questionHandlers.onMove).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('a', 'move-down')));
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('b', 'move-up')));
    expect(questionHandlers.onMove).toHaveBeenNthCalledWith(1, 'a', 'down');
    expect(questionHandlers.onMove).toHaveBeenNthCalledWith(2, 'b', 'up');
  });

  it('passes duplicate, delete and edits for the right question', () => {
    const { questionHandlers } = setup();
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('b', 'duplicate')));
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('b', 'delete')));
    fireEvent.changeText(screen.getByTestId(testIdFor.questionTitleInput('a')), 'Changed');
    expect(questionHandlers.onDuplicate).toHaveBeenCalledWith('b');
    expect(questionHandlers.onDelete).toHaveBeenCalledWith(b);
    expect(questionHandlers.onChange).toHaveBeenCalledWith({ ...a, title: 'Changed' });
  });
});
