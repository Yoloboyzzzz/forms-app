import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import { makeQuestion } from '@/testUtils/factories';
import { QuestionEditor } from './QuestionEditor';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

function setup(props: Partial<React.ComponentProps<typeof QuestionEditor>> = {}) {
  const handlers = {
    onChange: jest.fn(),
    onMoveUp: jest.fn(),
    onMoveDown: jest.fn(),
    onDuplicate: jest.fn(),
    onDelete: jest.fn(),
  };
  const question = props.question ?? makeQuestion('q1', { title: 'Name' });
  render(<QuestionEditor question={question} canMoveUp canMoveDown {...handlers} {...props} />);
  return { question, ...handlers };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('QuestionEditor', () => {
  it('shows the type and the current values', () => {
    setup({ question: makeQuestion('q1', { title: 'Name', description: 'Your full name' }) });
    expect(screen.getByText('Short answer')).toBeTruthy();
    expect(screen.getByTestId(testIdFor.questionTitleInput('q1')).props.value).toBe('Name');
    expect(screen.getByTestId(testIdFor.questionDescriptionInput('q1')).props.value).toBe('Your full name');
  });

  it('changes the title', () => {
    const { onChange, question } = setup();
    fireEvent.changeText(screen.getByTestId(testIdFor.questionTitleInput('q1')), 'New title');
    expect(onChange).toHaveBeenCalledWith({ ...question, title: 'New title' });
  });

  it('changes and clears the description', () => {
    const { onChange, question } = setup();
    fireEvent.changeText(screen.getByTestId(testIdFor.questionDescriptionInput('q1')), 'Hint');
    expect(onChange).toHaveBeenLastCalledWith({ ...question, description: 'Hint' });
    fireEvent.changeText(screen.getByTestId(testIdFor.questionDescriptionInput('q1')), '');
    expect(onChange).toHaveBeenLastCalledWith({ ...question, description: undefined });
  });

  it('toggles required', () => {
    const { onChange, question } = setup();
    fireEvent(screen.getByTestId(testIdFor.questionRequiredSwitch('q1')), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith({ ...question, isRequired: true });
  });

  it('runs the actions', () => {
    const { onMoveUp, onMoveDown, onDuplicate, onDelete } = setup();
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('q1', 'move-up')));
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('q1', 'move-down')));
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('q1', 'duplicate')));
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('q1', 'delete')));
    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(onMoveDown).toHaveBeenCalledTimes(1);
    expect(onDuplicate).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('disables moving past the edges', () => {
    const { onMoveUp, onMoveDown } = setup({ canMoveUp: false, canMoveDown: false });
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('q1', 'move-up')));
    fireEvent.press(screen.getByTestId(testIdFor.questionAction('q1', 'move-down')));
    expect(onMoveUp).not.toHaveBeenCalled();
    expect(onMoveDown).not.toHaveBeenCalled();
  });

  it('marks a deactivated question and locks its fields', () => {
    setup({ question: makeQuestion('q1', { isActive: false }) });
    expect(screen.getByText('Deactivated')).toBeTruthy();
    expect(screen.getByTestId(testIdFor.questionTitleInput('q1')).props.editable).toBe(false);
  });

  it('does not mark active questions', () => {
    setup();
    expect(screen.queryByText('Deactivated')).toBeNull();
  });

  it('renders type specific editors passed as children', () => {
    const question = makeQuestion('q1');
    render(
      <QuestionEditor
        question={question}
        onChange={jest.fn()}
        onMoveUp={jest.fn()}
        onMoveDown={jest.fn()}
        canMoveUp
        canMoveDown
        onDuplicate={jest.fn()}
        onDelete={jest.fn()}
      >
        <Text>type editor</Text>
      </QuestionEditor>,
    );
    expect(screen.getByText('type editor')).toBeTruthy();
  });
});
