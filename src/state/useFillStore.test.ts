import { ServiceError } from '@/services/errors';
import {
  deleteAnswer,
  getFillData,
  getOrCreateDraft,
  reopenSubmission,
  saveAnswer,
  submitSubmission,
} from '@/services/submissionService';
import { deleteFiles, uploadAnswerFile } from '@/services/storageService';
import { makeDetail, makeQuestion, makeSection } from '@/testUtils/factories';
import type { FileUploadQuestion, FormDetail, Submission } from '@/types/models';
import { resetAllStores } from './storeRegistry';
import { FILL_SAVE_DELAY_MS, useFillStore } from './useFillStore';

jest.mock('@/services/storageService', () => ({ deleteFiles: jest.fn(), uploadAnswerFile: jest.fn() }));
jest.mock('@/services/submissionService', () => ({
  deleteAnswer: jest.fn(),
  getFillData: jest.fn(),
  getOrCreateDraft: jest.fn(),
  reopenSubmission: jest.fn(),
  saveAnswer: jest.fn(),
  submitSubmission: jest.fn(),
}));

const draft: Submission = { id: 'sub1', assignmentId: 'a1', status: 'draft', createdAt: new Date(0), updatedAt: new Date(0) };
const submitted: Submission = { ...draft, status: 'submitted', submittedAt: new Date(0) };

const detail = (): FormDetail => makeDetail();
const qa = makeQuestion('a');
const qb = makeQuestion('b', { orderIndex: 1 });

const state = () => useFillStore.getState();

beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers();
  state().resetAll();
  jest.mocked(getOrCreateDraft).mockResolvedValue(draft);
  jest.mocked(saveAnswer).mockResolvedValue(undefined);
  jest.mocked(deleteAnswer).mockResolvedValue(undefined);
});

afterEach(() => jest.useRealTimers());

async function loadForm(extra: Partial<Awaited<ReturnType<typeof getFillData>>> = {}): Promise<void> {
  jest.mocked(getFillData).mockResolvedValue({
    assignment: { id: 'a1', formId: 'f1', userId: 'me', assignedBy: 'admin', assignedAt: new Date(0) },
    detail: detail(),
    answers: {},
    ...extra,
  });
  await state().load('a1');
}

describe('load', () => {
  it('loads the form and starts at the first section', async () => {
    await loadForm();
    expect(getFillData).toHaveBeenCalledWith('a1');
    expect(state()).toMatchObject({ assignmentId: 'a1', currentSectionId: 's1', isLoading: false, isPreview: false });
    expect(state().detail?.questions).toHaveLength(3);
  });

  it('keeps an existing draft and its answers', async () => {
    await loadForm({ submission: draft, answers: { a: 'hello' } });
    expect(state()).toMatchObject({ submission: draft, answers: { a: 'hello' } });
  });

  it('keeps the error key when loading fails', async () => {
    jest.mocked(getFillData).mockRejectedValue(new ServiceError('notFound'));
    await state().load('nope');
    expect(state()).toMatchObject({ errorKey: 'errors.notFound', isLoading: false, detail: undefined });
  });

  it('shows the loading state while loading', async () => {
    let finish: () => void = () => undefined;
    jest.mocked(getFillData).mockReturnValue(new Promise((resolve) => (finish = () => resolve({ assignment: { id: 'a1', formId: 'f1', userId: 'me', assignedBy: 'x', assignedAt: new Date(0) }, detail: detail(), answers: {} }))));
    const loading = state().load('a1');
    expect(state().isLoading).toBe(true);
    finish();
    await loading;
    expect(state().isLoading).toBe(false);
  });
});

describe('setAnswer and autosave', () => {
  it('applies the answer at once and saves it once after a pause', async () => {
    await loadForm();

    state().setAnswer(qa, 'H');
    state().setAnswer(qa, 'Hello');

    expect(state().answers.a).toBe('Hello');
    expect(state().saveState).toBe('dirty');
    expect(saveAnswer).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(FILL_SAVE_DELAY_MS);

    expect(getOrCreateDraft).toHaveBeenCalledWith('a1');
    expect(saveAnswer).toHaveBeenCalledTimes(1);
    expect(saveAnswer).toHaveBeenCalledWith('sub1', 'a', 'Hello');
    expect(state()).toMatchObject({ saveState: 'saved', submission: draft });
  });

  it('starts the draft only once', async () => {
    await loadForm();
    state().setAnswer(qa, 'x');
    await state().flush();
    state().setAnswer(qb, 'y');
    await state().flush();
    expect(getOrCreateDraft).toHaveBeenCalledTimes(1);
  });

  it('reuses the draft that was loaded', async () => {
    await loadForm({ submission: draft });
    state().setAnswer(qa, 'x');
    await state().flush();
    expect(getOrCreateDraft).not.toHaveBeenCalled();
    expect(saveAnswer).toHaveBeenCalledWith('sub1', 'a', 'x');
  });

  it('deletes an answer that was cleared', async () => {
    await loadForm({ submission: draft, answers: { a: 'old' } });
    state().setAnswer(qa, undefined);
    expect(state().answers).toEqual({});
    await state().flush();
    expect(deleteAnswer).toHaveBeenCalledWith('sub1', 'a');
  });

  it('does nothing to flush when nothing changed', async () => {
    await loadForm();
    await state().flush();
    expect(getOrCreateDraft).not.toHaveBeenCalled();
  });

  it('reports a failed save and retries the same answers', async () => {
    await loadForm({ submission: draft });
    jest.mocked(saveAnswer).mockRejectedValueOnce(new ServiceError('network'));
    state().setAnswer(qa, 'keep me');

    await state().flush();
    expect(state()).toMatchObject({ saveState: 'error', saveErrorKey: 'errors.network' });

    await state().flush();
    expect(saveAnswer).toHaveBeenLastCalledWith('sub1', 'a', 'keep me');
    expect(state()).toMatchObject({ saveState: 'saved', saveErrorKey: undefined });
  });

  it('prefers an answer given while a save fails', async () => {
    await loadForm({ submission: draft });
    let fail: (error: Error) => void = () => undefined;
    jest.mocked(saveAnswer).mockReturnValueOnce(new Promise((_, reject) => (fail = reject)));
    state().setAnswer(qa, 'old');
    const flushing = state().flush();

    state().setAnswer(qa, 'newer');
    fail(new Error('boom'));
    await flushing;
    await state().flush();

    expect(saveAnswer).toHaveBeenLastCalledWith('sub1', 'a', 'newer');
  });

  it('keeps answers given during a save as dirty', async () => {
    await loadForm({ submission: draft });
    let finish: () => void = () => undefined;
    jest.mocked(saveAnswer).mockReturnValueOnce(new Promise((resolve) => (finish = () => resolve(undefined))));
    state().setAnswer(qa, 'first');
    const flushing = state().flush();
    state().setAnswer(qb, 'second');
    finish();
    await flushing;
    expect(state().saveState).toBe('dirty');
  });

  it('shows the saving state while a save runs', async () => {
    await loadForm({ submission: draft });
    let finish: () => void = () => undefined;
    jest.mocked(saveAnswer).mockReturnValueOnce(new Promise((resolve) => (finish = () => resolve(undefined))));
    state().setAnswer(qa, 'x');
    const flushing = state().flush();
    expect(state().saveState).toBe('saving');
    finish();
    await flushing;
  });

  it('keeps answers while offline and saves them when the connection returns', async () => {
    await loadForm({ submission: draft });
    state().setOnline(false);
    state().setAnswer(qa, 'offline answer');

    await jest.advanceTimersByTimeAsync(FILL_SAVE_DELAY_MS);
    expect(saveAnswer).not.toHaveBeenCalled();
    expect(state().saveState).toBe('dirty');

    state().setOnline(true);
    await jest.advanceTimersByTimeAsync(0);
    expect(saveAnswer).toHaveBeenCalledWith('sub1', 'a', 'offline answer');
  });

  it('does not save anything in preview', async () => {
    state().startPreview(detail());
    state().setAnswer(qa, 'x');
    state().setAnswer(qa, undefined);
    await state().flush();
    await jest.advanceTimersByTimeAsync(FILL_SAVE_DELAY_MS);
    expect(saveAnswer).not.toHaveBeenCalled();
    expect(getOrCreateDraft).not.toHaveBeenCalled();
    expect(state().saveState).toBe('idle');
  });
});

describe('file uploads', () => {
  const upload: FileUploadQuestion = {
    id: 'up',
    formId: 'f1',
    sectionId: 's1',
    title: 'Upload',
    isRequired: false,
    orderIndex: 5,
    isActive: true,
    questionType: 'file_upload',
    settings: { maxFiles: 5, maxFileSizeMb: 1, allowedTypes: ['.pdf'] },
  };
  const pdf = (name: string, size = 100) => ({ uri: `file:///${name}`, name, mimeType: 'application/pdf', size });

  beforeEach(() => {
    jest.mocked(uploadAnswerFile).mockImplementation(async (_user, _submission, _question, file) => `path/${file.name}`);
    jest.mocked(deleteFiles).mockResolvedValue(undefined);
  });

  it('uploads files into the draft and adds their paths to the answer', async () => {
    await loadForm();

    const result = await state().attachFiles(upload, [pdf('a.pdf'), pdf('b.pdf')], 'me');

    expect(result).toEqual({ added: 2 });
    expect(getOrCreateDraft).toHaveBeenCalledWith('a1');
    expect(uploadAnswerFile).toHaveBeenCalledWith('me', 'sub1', 'up', expect.objectContaining({ name: 'a.pdf' }));
    expect(state().answers.up).toEqual(['path/a.pdf', 'path/b.pdf']);
    expect(state().saveState).toBe('dirty');
  });

  it('adds to files that are already there', async () => {
    await loadForm({ submission: draft, answers: { up: ['path/old.pdf'] } });
    await state().attachFiles(upload, [pdf('a.pdf')], 'me');
    expect(state().answers.up).toEqual(['path/old.pdf', 'path/a.pdf']);
  });

  it('stops at the first refused file and keeps the ones that were fine', async () => {
    await loadForm();

    const result = await state().attachFiles(upload, [pdf('a.pdf'), pdf('big.pdf', 5 * 1024 * 1024), pdf('c.pdf')], 'me');

    expect(result).toMatchObject({ added: 1, refused: { reason: 'tooLarge', file: { name: 'big.pdf' } } });
    expect(uploadAnswerFile).toHaveBeenCalledTimes(1);
    expect(state().answers.up).toEqual(['path/a.pdf']);
  });

  it('refuses a file when nothing was added before it', async () => {
    await loadForm();
    const result = await state().attachFiles(upload, [{ ...pdf('x.png'), mimeType: 'image/png' }], 'me');
    expect(result).toMatchObject({ added: 0, refused: { reason: 'wrongType' } });
    expect(state().answers.up).toBeUndefined();
  });

  it('refuses more files than allowed', async () => {
    await loadForm({ submission: draft, answers: { up: ['1', '2', '3', '4', '5'] } });
    const result = await state().attachFiles(upload, [pdf('6.pdf')], 'me');
    expect(result).toMatchObject({ added: 0, refused: { reason: 'tooMany' } });
  });

  it('cannot upload offline, and does nothing in preview', async () => {
    await loadForm({ submission: draft });
    state().setOnline(false);
    await expect(state().attachFiles(upload, [pdf('a.pdf')], 'me')).rejects.toMatchObject({ code: 'network' });

    state().startPreview(detail());
    await expect(state().attachFiles(upload, [pdf('a.pdf')], 'me')).resolves.toEqual({ added: 0 });
  });

  it('rethrows an upload failure and keeps earlier files', async () => {
    await loadForm();
    jest.mocked(uploadAnswerFile).mockResolvedValueOnce('path/a.pdf').mockRejectedValueOnce(new ServiceError('network'));

    await expect(state().attachFiles(upload, [pdf('a.pdf'), pdf('b.pdf')], 'me')).rejects.toMatchObject({ code: 'network' });
  });

  it('removes a file from storage and from the answer', async () => {
    await loadForm({ submission: draft, answers: { up: ['path/a.pdf', 'path/b.pdf'] } });

    await state().removeFile(upload, 'path/a.pdf');

    expect(deleteFiles).toHaveBeenCalledWith('form-uploads', ['path/a.pdf']);
    expect(state().answers.up).toEqual(['path/b.pdf']);
  });

  it('clears the answer when the last file is removed', async () => {
    await loadForm({ submission: draft, answers: { up: ['path/a.pdf'] } });
    await state().removeFile(upload, 'path/a.pdf');
    expect(state().answers.up).toBeUndefined();
  });

  it('keeps the answer when deleting from storage fails', async () => {
    await loadForm({ submission: draft, answers: { up: ['path/a.pdf'] } });
    jest.mocked(deleteFiles).mockRejectedValue(new ServiceError('forbidden'));
    await expect(state().removeFile(upload, 'path/a.pdf')).rejects.toMatchObject({ code: 'forbidden' });
    expect(state().answers.up).toEqual(['path/a.pdf']);
  });

  it('removes a file when the answer is missing without breaking', async () => {
    await loadForm({ submission: draft });
    await state().removeFile(upload, 'path/x.pdf');
    expect(state().answers.up).toBeUndefined();
  });
});

describe('moving between sections', () => {
  it('goes to the next section and back again', async () => {
    await loadForm();

    expect(state().goNext()).toEqual({ kind: 'section', sectionId: 's2' });
    expect(state()).toMatchObject({ currentSectionId: 's2', history: ['s1'] });

    state().goBack();
    expect(state()).toMatchObject({ currentSectionId: 's1', history: [] });
  });

  it('asks to submit after the last section and stays put', async () => {
    await loadForm();
    state().goNext();
    expect(state().goNext()).toEqual({ kind: 'submit' });
    expect(state().currentSectionId).toBe('s2');
  });

  it('follows the branching of the answers, and back retraces the same path', async () => {
    const branching = makeQuestion('choice', {
      sectionId: 's1',
      questionType: 'multiple_choice',
      options: [{ id: 'skip', label: 'Skip', goTo: 's3' }],
      settings: { goToSectionBasedOnAnswer: true },
    });
    const full: FormDetail = {
      ...detail(),
      sections: [makeSection('s1', 0), makeSection('s2', 1), makeSection('s3', 2)],
      questions: [branching],
    };
    await loadForm({ detail: full });
    state().setAnswer(branching, { optionId: 'skip' });

    expect(state().goNext()).toEqual({ kind: 'section', sectionId: 's3' });
    state().goBack();
    expect(state().currentSectionId).toBe('s1');
  });

  it('does nothing going back from the first section', async () => {
    await loadForm();
    state().goBack();
    expect(state().currentSectionId).toBe('s1');
  });

  it('asks to submit when no form is loaded', () => {
    expect(state().goNext()).toEqual({ kind: 'submit' });
  });
});

describe('submit', () => {
  it('saves pending answers, then submits', async () => {
    await loadForm({ submission: draft });
    jest.mocked(submitSubmission).mockResolvedValue(submitted);
    state().setAnswer(qa, 'last answer');

    await state().submit();

    expect(saveAnswer).toHaveBeenCalledWith('sub1', 'a', 'last answer');
    expect(submitSubmission).toHaveBeenCalledWith('sub1');
    expect(state()).toMatchObject({ submission: submitted, isSubmitting: false });
  });

  it('starts a draft when the form was submitted without any answer', async () => {
    await loadForm();
    jest.mocked(submitSubmission).mockResolvedValue(submitted);
    await state().submit();
    expect(getOrCreateDraft).toHaveBeenCalledWith('a1');
    expect(submitSubmission).toHaveBeenCalledWith('sub1');
  });

  it('does not submit when saving the last answers failed', async () => {
    await loadForm({ submission: draft });
    jest.mocked(saveAnswer).mockRejectedValue(new ServiceError('network'));
    state().setAnswer(qa, 'x');

    await expect(state().submit()).rejects.toBeInstanceOf(ServiceError);

    expect(submitSubmission).not.toHaveBeenCalled();
    expect(state().isSubmitting).toBe(false);
  });

  it('cannot submit offline', async () => {
    await loadForm({ submission: draft });
    state().setOnline(false);
    await expect(state().submit()).rejects.toMatchObject({ code: 'network' });
    expect(submitSubmission).not.toHaveBeenCalled();
  });

  it('rethrows what the database says, such as missing required answers', async () => {
    await loadForm({ submission: draft });
    jest.mocked(submitSubmission).mockRejectedValue(new ServiceError('missingRequired'));
    await expect(state().submit()).rejects.toMatchObject({ code: 'missingRequired' });
    expect(state().isSubmitting).toBe(false);
  });

  it('does nothing in preview', async () => {
    state().startPreview(detail());
    await state().submit();
    expect(submitSubmission).not.toHaveBeenCalled();
  });
});

describe('reopen', () => {
  it('turns a submitted response back into a draft at the first section', async () => {
    await loadForm({ submission: submitted, answers: { a: 'x' } });
    jest.mocked(reopenSubmission).mockResolvedValue(draft);
    state().goNext();

    await state().reopen();

    expect(reopenSubmission).toHaveBeenCalledWith('sub1');
    expect(state()).toMatchObject({ submission: draft, currentSectionId: 's1', history: [] });
  });

  it('does nothing without a response', async () => {
    await loadForm();
    await state().reopen();
    expect(reopenSubmission).not.toHaveBeenCalled();
  });

  it('reports that editing is not allowed', async () => {
    await loadForm({ submission: submitted });
    jest.mocked(reopenSubmission).mockRejectedValue(new ServiceError('forbidden'));
    await expect(state().reopen()).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('works when the form was cleared meanwhile', async () => {
    await loadForm({ submission: submitted });
    jest.mocked(reopenSubmission).mockResolvedValue(draft);
    useFillStore.setState({ detail: undefined });
    await state().reopen();
    expect(state().currentSectionId).toBeUndefined();
  });
});

describe('preview and logout', () => {
  it('starts a preview at the first section', () => {
    state().startPreview(detail());
    expect(state()).toMatchObject({ isPreview: true, currentSectionId: 's1', assignmentId: undefined });
  });

  it('is cleared with all stores and cancels pending saves', async () => {
    await loadForm({ submission: draft });
    state().setAnswer(qa, 'unsaved');

    resetAllStores();
    await jest.advanceTimersByTimeAsync(FILL_SAVE_DELAY_MS);

    expect(state()).toMatchObject({ detail: undefined, answers: {}, isOnline: true });
    expect(saveAnswer).not.toHaveBeenCalled();
  });
});
