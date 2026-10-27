import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import type { FileUploadQuestion } from '@/types/models';
import { QuestionRenderer, type FileUploadControls } from './QuestionRenderer';
import { FileUploadField } from './FileUploadField';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const question = (settings: FileUploadQuestion['settings'] = {}): FileUploadQuestion => ({
  id: 'q1',
  formId: 'f1',
  sectionId: 's1',
  title: 'Upload your CV',
  isRequired: false,
  orderIndex: 0,
  isActive: true,
  questionType: 'file_upload',
  settings,
});

const path = 'u1/s1/q1/1700000000000-cv.pdf';

function setup(props: Partial<React.ComponentProps<typeof FileUploadField>> = {}) {
  const onPick = jest.fn();
  const onRemove = jest.fn();
  render(<FileUploadField question={question()} value={undefined} onPick={onPick} onRemove={onRemove} {...props} />);
  return { onPick, onRemove };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('FileUploadField', () => {
  it('offers to add a file', () => {
    const { onPick } = setup();
    fireEvent.press(screen.getByTestId(testIdFor.uploadButton('q1')));
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it('lists uploaded files by their original name and removes one', () => {
    const { onRemove } = setup({ value: [path] });
    expect(screen.getByTestId(testIdFor.uploadedFile('q1', path))).toHaveTextContent(/cv\.pdf/);
    fireEvent.press(screen.getByTestId(testIdFor.removeUploadedFile('q1', path)));
    expect(onRemove).toHaveBeenCalledWith(path);
  });

  it('hides the add button when the limit is reached', () => {
    setup({ value: [path] });
    expect(screen.queryByTestId(testIdFor.uploadButton('q1'))).toBeNull();
  });

  it('keeps offering uploads until the configured number of files', () => {
    setup({ question: question({ maxFiles: 5 }), value: [path] });
    expect(screen.getByTestId(testIdFor.uploadButton('q1'))).toBeTruthy();
  });

  it('shows why a file was refused', () => {
    setup({ uploadErrorText: 'This file is larger than 10 MB.' });
    expect(screen.getByTestId(testIdFor.uploadError('q1'))).toHaveTextContent(/larger than 10 MB/);
  });

  it('cannot be pressed while uploading', () => {
    const { onPick } = setup({ isUploading: true });
    fireEvent.press(screen.getByTestId(testIdFor.uploadButton('q1')));
    expect(onPick).not.toHaveBeenCalled();
  });

  it('ignores an answer of the wrong shape', () => {
    setup({ value: 'text' });
    expect(screen.getByTestId(testIdFor.uploadButton('q1'))).toBeTruthy();
  });
});

describe('QuestionRenderer file uploads', () => {
  const controls = (overrides: Partial<FileUploadControls> = {}): FileUploadControls => ({
    onPick: jest.fn(),
    onRemove: jest.fn(),
    errors: {},
    ...overrides,
  });

  it('shows nothing without upload controls', () => {
    const { toJSON } = render(<QuestionRenderer question={question()} value={undefined} onChange={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });

  it('passes the question to the controls', () => {
    const fileUpload = controls();
    render(<QuestionRenderer question={question()} value={[path]} onChange={jest.fn()} fileUpload={fileUpload} />);
    fireEvent.press(screen.getByTestId(testIdFor.removeUploadedFile('q1', path)));
    expect(fileUpload.onRemove).toHaveBeenCalledWith(question(), path);
  });

  it('shows the upload state and error of that question', () => {
    render(
      <QuestionRenderer
        question={question()}
        value={undefined}
        onChange={jest.fn()}
        fileUpload={controls({ uploadingQuestionId: 'q1', errors: { q1: 'Too big' } })}
      />,
    );
    expect(screen.getByTestId(testIdFor.uploadError('q1'))).toHaveTextContent(/Too big/);
  });

  it('opens the picker for the question', () => {
    const fileUpload = controls();
    render(<QuestionRenderer question={question()} value={undefined} onChange={jest.fn()} fileUpload={fileUpload} />);
    fireEvent.press(screen.getByTestId(testIdFor.uploadButton('q1')));
    expect(fileUpload.onPick).toHaveBeenCalledWith(question());
  });
});
