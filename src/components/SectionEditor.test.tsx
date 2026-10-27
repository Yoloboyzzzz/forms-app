import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import { makeQuestion, makeSection } from '@/testUtils/factories';
import { SectionEditor } from './SectionEditor';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const a = makeQuestion('a', { title: 'First' });
const b = makeQuestion('b', { title: 'Second', orderIndex: 1 });
const sectionOptions = [
  { id: 's1', label: 'Section 1' },
  { id: 's2', label: 'Extra' },
  { id: 's3', label: 'Section 3' },
];

function setup(props: Partial<React.ComponentProps<typeof SectionEditor>> = {}) {
  const questionHandlers = { onChange: jest.fn(), onMove: jest.fn(), onDuplicate: jest.fn(), onDelete: jest.fn() };
  const sectionHandlers = { onEdit: jest.fn(), onChangeAfter: jest.fn(), onMove: jest.fn(), onDelete: jest.fn() };
  const onAddQuestion = jest.fn();
  render(
    <SectionEditor
      section={makeSection('s1')}
      position={1}
      sectionOptions={sectionOptions}
      questions={[a, b]}
      questionHandlers={questionHandlers}
      sectionHandlers={sectionHandlers}
      onAddQuestion={onAddQuestion}
      canMoveUp
      canMoveDown
      canDelete
      {...props}
    />,
  );
  return { questionHandlers, sectionHandlers, onAddQuestion };
}

const field = (name: string) => testIdFor.sectionField('s1', name);
const action = (name: string) => testIdFor.sectionAction('s1', name);

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('SectionEditor questions', () => {
  it('shows the position as heading', () => {
    setup({ position: 2 });
    expect(screen.getByText('Section 2')).toBeTruthy();
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

describe('SectionEditor section settings', () => {
  it('edits and clears title and description', () => {
    const { sectionHandlers } = setup({ section: makeSection('s1', 0, { title: 'About you', description: 'Intro' }) });
    expect(screen.getByTestId(field('title-input')).props.value).toBe('About you');
    expect(screen.getByTestId(field('description-input')).props.value).toBe('Intro');
    fireEvent.changeText(screen.getByTestId(field('title-input')), 'New');
    fireEvent.changeText(screen.getByTestId(field('title-input')), '');
    fireEvent.changeText(screen.getByTestId(field('description-input')), 'More');
    fireEvent.changeText(screen.getByTestId(field('description-input')), '');
    expect(sectionHandlers.onEdit.mock.calls).toEqual([
      ['s1', { title: 'New' }],
      ['s1', { title: undefined }],
      ['s1', { description: 'More' }],
      ['s1', { description: undefined }],
    ]);
  });

  it('moves and deletes the section', () => {
    const section = makeSection('s1');
    const { sectionHandlers } = setup({ section });
    fireEvent.press(screen.getByTestId(action('move-up')));
    fireEvent.press(screen.getByTestId(action('move-down')));
    fireEvent.press(screen.getByTestId(action('delete')));
    expect(sectionHandlers.onMove).toHaveBeenNthCalledWith(1, 's1', 'up');
    expect(sectionHandlers.onMove).toHaveBeenNthCalledWith(2, 's1', 'down');
    expect(sectionHandlers.onDelete).toHaveBeenCalledWith(section);
  });

  it('disables moving at the edges and deleting the last section', () => {
    const { sectionHandlers } = setup({ canMoveUp: false, canMoveDown: false, canDelete: false });
    fireEvent.press(screen.getByTestId(action('move-up')));
    fireEvent.press(screen.getByTestId(action('move-down')));
    fireEvent.press(screen.getByTestId(action('delete')));
    expect(sectionHandlers.onMove).not.toHaveBeenCalled();
    expect(sectionHandlers.onDelete).not.toHaveBeenCalled();
  });

  it('shows what happens after the section', () => {
    setup({ section: makeSection('s1', 0, { afterAction: 'goto', goToSectionId: 's3' }) });
    expect(screen.getByTestId(field('after')).props.accessibilityValue).toEqual({ text: 'Go to Section 3' });
  });

  it('changes it to go to another section, never to itself', () => {
    const { sectionHandlers } = setup();
    fireEvent.press(screen.getByTestId(field('after')));
    expect(screen.queryByTestId(`${field('after')}-option-goto:s1`)).toBeNull();
    fireEvent.press(screen.getByTestId(`${field('after')}-option-goto:s2`));
    expect(sectionHandlers.onChangeAfter).toHaveBeenCalledWith('s1', { afterAction: 'goto', goToSectionId: 's2' });
  });

  it('can submit after the section or continue again', () => {
    const { sectionHandlers } = setup();
    fireEvent.press(screen.getByTestId(field('after')));
    fireEvent.press(screen.getByTestId(`${field('after')}-option-submit`));
    expect(sectionHandlers.onChangeAfter).toHaveBeenLastCalledWith('s1', { afterAction: 'submit', goToSectionId: undefined });
    fireEvent.press(screen.getByTestId(field('after')));
    fireEvent.press(screen.getByTestId(`${field('after')}-option-next`));
    expect(sectionHandlers.onChangeAfter).toHaveBeenLastCalledWith('s1', { afterAction: 'next', goToSectionId: undefined });
  });

  it('offers no "after this section" choice when there is only one section', () => {
    setup({ sectionOptions: [{ id: 's1', label: 'Section 1' }] });
    expect(screen.queryByTestId(field('after'))).toBeNull();
  });
});
