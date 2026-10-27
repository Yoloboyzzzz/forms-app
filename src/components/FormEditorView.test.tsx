import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor, testIds } from '@/constants/testIds';
import { makeDetail, makeForm } from '@/testUtils/factories';
import { FormEditorView } from './FormEditorView';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

function setup(props: Partial<React.ComponentProps<typeof FormEditorView>> = {}) {
  const handlers = {
    onRetrySave: jest.fn(),
    onChangeForm: jest.fn(),
    questionHandlers: { onChange: jest.fn(), onMove: jest.fn(), onDuplicate: jest.fn(), onDelete: jest.fn() },
    sectionHandlers: { onEdit: jest.fn(), onChangeAfter: jest.fn(), onMove: jest.fn(), onDelete: jest.fn() },
    onAddQuestion: jest.fn(),
    onAddSection: jest.fn(),
  };
  render(<FormEditorView detail={makeDetail()} saveState="idle" {...handlers} {...props} />);
  return handlers;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('FormEditorView', () => {
  it('shows the form header and status', () => {
    setup({ detail: makeDetail({ form: makeForm({ description: 'About us' }) }) });
    expect(screen.getByTestId(testIds.editor.titleInput).props.value).toBe('Customer feedback');
    expect(screen.getByTestId(testIds.editor.descriptionInput).props.value).toBe('About us');
    expect(screen.getByText('Draft')).toBeTruthy();
  });

  it('edits title and description', () => {
    const { onChangeForm } = setup();
    fireEvent.changeText(screen.getByTestId(testIds.editor.titleInput), 'New title');
    fireEvent.changeText(screen.getByTestId(testIds.editor.descriptionInput), 'Text');
    fireEvent.changeText(screen.getByTestId(testIds.editor.descriptionInput), '');
    expect(onChangeForm).toHaveBeenNthCalledWith(1, { title: 'New title' });
    expect(onChangeForm).toHaveBeenNthCalledWith(2, { description: 'Text' });
    expect(onChangeForm).toHaveBeenNthCalledWith(3, { description: undefined });
  });

  it('renders each section with its own questions, in order', () => {
    setup();
    expect(screen.getByTestId(testIdFor.section('s1'))).toBeTruthy();
    expect(screen.getByTestId(testIdFor.section('s2'))).toBeTruthy();
    expect(screen.getByText('Section 1')).toBeTruthy();
    expect(screen.getByText('Section 2')).toBeTruthy();
    expect(screen.getByTestId(testIdFor.question('c'))).toBeTruthy();
  });

  it('shows the save state and lets the user retry', () => {
    const { onRetrySave } = setup({ saveState: 'error', saveErrorKey: 'errors.network' });
    fireEvent.press(screen.getByTestId(testIds.editor.retrySaveButton));
    expect(onRetrySave).toHaveBeenCalledTimes(1);
  });

  it('names untitled sections by position and titled ones by title', () => {
    const detail = makeDetail();
    detail.sections[1] = { ...detail.sections[1], title: 'Extra' };
    setup({ detail });
    fireEvent.press(screen.getByTestId(testIdFor.sectionField('s1', 'after')));
    expect(screen.getByTestId(`${testIdFor.sectionField('s1', 'after')}-option-goto:s2`)).toBeTruthy();
    expect(screen.getByText('Go to Extra')).toBeTruthy();
  });

  it('adds a section', () => {
    const { onAddSection } = setup();
    fireEvent.press(screen.getByTestId(testIds.editor.addSectionButton));
    expect(onAddSection).toHaveBeenCalledTimes(1);
  });

  it('only lets sections move where there is room and keeps at least one', () => {
    const { sectionHandlers } = setup();
    fireEvent.press(screen.getByTestId(testIdFor.sectionAction('s1', 'move-up')));
    fireEvent.press(screen.getByTestId(testIdFor.sectionAction('s2', 'move-down')));
    expect(sectionHandlers.onMove).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId(testIdFor.sectionAction('s1', 'move-down')));
    expect(sectionHandlers.onMove).toHaveBeenCalledWith('s1', 'down');
  });

  it('cannot delete the only section', () => {
    const detail = makeDetail();
    detail.sections = [detail.sections[0]];
    const { sectionHandlers } = setup({ detail });
    fireEvent.press(screen.getByTestId(testIdFor.sectionAction('s1', 'delete')));
    expect(sectionHandlers.onDelete).not.toHaveBeenCalled();
  });

  it('adds a question to a section', () => {
    const { onAddQuestion } = setup();
    fireEvent.press(screen.getByTestId(testIdFor.addQuestionButton('s2')));
    expect(onAddQuestion).toHaveBeenCalledWith('s2');
  });
});
