import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor, testIds } from '@/constants/testIds';
import { makeForm, makeQuestion, makeSection } from '@/testUtils/factories';
import { ConfirmationScreen } from './ConfirmationScreen';
import { FormFillView } from './FormFillView';
import { ProgressHeader } from './ProgressHeader';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const ids = testIds.fill;

function setup(props: Partial<React.ComponentProps<typeof FormFillView>> = {}) {
  const handlers = {
    onChangeAnswer: jest.fn(),
    onNext: jest.fn(),
    onBack: jest.fn(),
    onConfirmSubmit: jest.fn(),
    onCancelSubmit: jest.fn(),
    onRetrySave: jest.fn(),
  };
  render(
    <FormFillView
      form={makeForm({ title: 'Feedback' })}
      section={makeSection('s1')}
      questions={[makeQuestion('a', { title: 'Name' }), makeQuestion('b', { title: 'Age' })]}
      answers={{ a: 'Ann' }}
      errors={{}}
      position={{ current: 1, total: 3 }}
      canGoBack={false}
      isLastSection={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('FormFillView', () => {
  it('shows the form title, the position and every question with its answer', () => {
    setup();
    expect(screen.getByText('Feedback')).toBeTruthy();
    expect(screen.getByTestId(ids.progress)).toHaveTextContent('Section 1 of 3');
    expect(screen.getByTestId(testIdFor.questionInput('a')).props.value).toBe('Ann');
    expect(screen.getByTestId(testIdFor.questionInput('b')).props.value).toBe('');
  });

  it('shows the section title and description', () => {
    setup({ section: makeSection('s1', 0, { title: 'About you', description: 'A few questions' }) });
    expect(screen.getByTestId(ids.sectionTitle)).toHaveTextContent('About you');
    expect(screen.getByText('A few questions')).toBeTruthy();
  });

  it('reports answers for the right question', () => {
    const { onChangeAnswer } = setup();
    fireEvent.changeText(screen.getByTestId(testIdFor.questionInput('b')), '30');
    expect(onChangeAnswer).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }), '30');
  });

  it('shows the error of a question', () => {
    setup({ errors: { a: 'This question is required.' } });
    expect(screen.getByTestId(testIdFor.questionError('a'))).toHaveTextContent('This question is required.');
  });

  it('goes to the next section, and back only when there is a previous one', () => {
    const { onNext, onBack } = setup({ canGoBack: true });
    fireEvent.press(screen.getByTestId(ids.nextButton));
    fireEvent.press(screen.getByTestId(ids.backButton));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('has no back button in the first section', () => {
    setup();
    expect(screen.queryByTestId(ids.backButton)).toBeNull();
  });

  it('offers submit instead of next in the last section', () => {
    const { onNext } = setup({ isLastSection: true });
    expect(screen.queryByTestId(ids.nextButton)).toBeNull();
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('cannot submit while offline and says so', () => {
    const { onNext } = setup({ isLastSection: true, isOnline: false });
    expect(screen.getByTestId(ids.offlineBanner)).toBeTruthy();
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('can still go on while offline', () => {
    const { onNext } = setup({ isOnline: false });
    fireEvent.press(screen.getByTestId(ids.nextButton));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('shows no offline banner while online', () => {
    setup();
    expect(screen.queryByTestId(ids.offlineBanner)).toBeNull();
  });

  it('blocks submitting while it runs', () => {
    const { onNext } = setup({ isLastSection: true, isSubmitting: true });
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('asks for confirmation before submitting', () => {
    const { onConfirmSubmit, onCancelSubmit } = setup({ isLastSection: true, isConfirming: true });
    expect(screen.getByText('Submit this form?')).toBeTruthy();
    expect(screen.getByText('You can no longer change your answers after submitting.')).toBeTruthy();
    fireEvent.press(screen.getByTestId(`${ids.confirmDialog}-confirm`));
    fireEvent.press(screen.getByTestId(`${ids.confirmDialog}-cancel`));
    expect(onConfirmSubmit).toHaveBeenCalledTimes(1);
    expect(onCancelSubmit).toHaveBeenCalledTimes(1);
  });

  it('tells when answers can still be edited after submitting', () => {
    setup({ form: makeForm({ allowEditAfterSubmit: true }), isLastSection: true, isConfirming: true });
    expect(screen.getByText('You can still edit your answers later.')).toBeTruthy();
  });

  it('shows why submitting failed', () => {
    setup({ isLastSection: true, submitErrorKey: 'errors.missingRequired' });
    expect(screen.getByTestId(ids.submitError)).toHaveTextContent('Answer all required questions first.');
  });

  it('shows the save status and a retry', () => {
    const { onRetrySave } = setup({ saveState: 'error', saveErrorKey: 'errors.network' });
    fireEvent.press(screen.getByTestId(ids.retrySaveButton));
    expect(onRetrySave).toHaveBeenCalledTimes(1);
  });

  it('marks a preview and shows no save status there', () => {
    setup({ isPreview: true, saveState: 'saved', isOnline: false });
    expect(screen.getByTestId(ids.previewBanner)).toBeTruthy();
    expect(screen.queryByTestId(ids.saveIndicator)).toBeNull();
    expect(screen.queryByTestId(ids.offlineBanner)).toBeNull();
  });

  it('lets a preview finish even without a connection', () => {
    const { onNext } = setup({ isPreview: true, isLastSection: true, isOnline: false });
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

describe('FormFillView images', () => {
  it('shows the image of a question that has one', () => {
    setup({
      questions: [makeQuestion('a', { title: 'Name', imagePath: 'f1/a/p.png' }), makeQuestion('b', { title: 'Age' })],
      imageUrls: { 'f1/a/p.png': 'https://x/p.png' },
    });
    expect(screen.getByTestId(testIdFor.questionImage('a')).props.source).toEqual({ uri: 'https://x/p.png' });
    expect(screen.queryByTestId(testIdFor.questionImage('b'))).toBeNull();
  });

  it('shows the question without its image while the link is not known', () => {
    setup({ questions: [makeQuestion('a', { imagePath: 'f1/a/p.png' })], imageUrls: {} });
    expect(screen.queryByTestId(testIdFor.questionImage('a'))).toBeNull();
    expect(screen.getByTestId(testIdFor.questionInput('a'))).toBeTruthy();
  });
});

describe('ProgressHeader', () => {
  const position = { current: 2, total: 4 };

  it('draws the progress bar only when the form wants it', () => {
    const { rerender } = render(<ProgressHeader title="T" position={position} showProgressBar />);
    expect(screen.getByLabelText('Section 2 of 4', { exact: true, includeHiddenElements: true })).toBeTruthy();
    rerender(<ProgressHeader title="T" position={position} showProgressBar={false} />);
    expect(screen.queryAllByLabelText('Section 2 of 4')).toHaveLength(0);
  });

  it.each([
    ['saving', 'Saving…'],
    ['dirty', 'Not saved yet'],
    ['saved', 'Draft saved'],
  ] as const)('shows the %s state', (state, text) => {
    render(<ProgressHeader title="T" position={position} showProgressBar={false} saveState={state} />);
    expect(screen.getByText(text)).toBeTruthy();
  });

  it('shows a failed save without a reason or retry', () => {
    render(<ProgressHeader title="T" position={position} showProgressBar={false} saveState="error" />);
    expect(screen.getByText('Saving failed')).toBeTruthy();
    expect(screen.queryByTestId(ids.retrySaveButton)).toBeNull();
  });

  it('shows nothing about saving when idle', () => {
    render(<ProgressHeader title="T" position={position} showProgressBar={false} saveState="idle" />);
    expect(screen.queryByTestId(ids.saveIndicator)).toBeNull();
  });
});

describe('ConfirmationScreen', () => {
  it('shows the form message, or a default one', () => {
    const { rerender } = render(<ConfirmationScreen message="Thanks for your feedback!" onBack={jest.fn()} />);
    expect(screen.getByTestId(testIds.done.message)).toHaveTextContent('Thanks for your feedback!');
    rerender(<ConfirmationScreen onBack={jest.fn()} />);
    expect(screen.getByTestId(testIds.done.message)).toHaveTextContent('Your response has been recorded.');
    rerender(<ConfirmationScreen message="" onBack={jest.fn()} />);
    expect(screen.getByTestId(testIds.done.message)).toHaveTextContent('Your response has been recorded.');
  });

  it('goes back to the forms', () => {
    const onBack = jest.fn();
    render(<ConfirmationScreen onBack={onBack} />);
    fireEvent.press(screen.getByTestId(testIds.done.backButton));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('offers editing only when allowed, and shows why it failed', () => {
    const onEdit = jest.fn();
    const { rerender } = render(<ConfirmationScreen onBack={jest.fn()} />);
    expect(screen.queryByTestId(testIds.done.editButton)).toBeNull();
    rerender(<ConfirmationScreen onBack={jest.fn()} onEdit={onEdit} editErrorKey="errors.forbidden" />);
    fireEvent.press(screen.getByTestId(testIds.done.editButton));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId(testIds.done.editError)).toHaveTextContent('You do not have access to this.');
  });
});
