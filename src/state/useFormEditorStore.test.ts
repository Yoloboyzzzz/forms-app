import { ServiceError } from '@/services/errors';
import { archiveForm, getFormDetail, publishForm, updateForm } from '@/services/formService';
import {
  addQuestion,
  duplicateQuestion,
  removeQuestion,
  reorderQuestions,
  updateQuestion,
} from '@/services/questionService';
import { deleteFiles, uploadQuestionImage } from '@/services/storageService';
import { addSection, deleteSection, reorderSections, updateSection } from '@/services/sectionService';
import type { Form, FormDetail, FormSection, Question } from '@/types/models';
import { resetAllStores } from './storeRegistry';
import { SAVE_DELAY_MS, useFormEditorStore } from './useFormEditorStore';

jest.mock('@/services/storageService', () => ({ deleteFiles: jest.fn(), uploadQuestionImage: jest.fn() }));
jest.mock('@/services/formService', () => ({
  archiveForm: jest.fn(),
  getFormDetail: jest.fn(),
  publishForm: jest.fn(),
  updateForm: jest.fn(),
}));
jest.mock('@/services/questionService', () => ({
  addQuestion: jest.fn(),
  duplicateQuestion: jest.fn(),
  removeQuestion: jest.fn(),
  reorderQuestions: jest.fn(),
  updateQuestion: jest.fn(),
}));
jest.mock('@/services/sectionService', () => ({
  addSection: jest.fn(),
  deleteSection: jest.fn(),
  reorderSections: jest.fn(),
  updateSection: jest.fn(),
}));

const form: Form = {
  id: 'f1',
  title: 'Form',
  status: 'draft',
  isAcceptingResponses: true,
  limitOneResponse: true,
  allowEditAfterSubmit: false,
  shuffleQuestionOrder: false,
  showProgressBar: true,
  createdBy: 'u1',
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

function section(id: string, orderIndex: number, extra: Partial<FormSection> = {}): FormSection {
  return { id, formId: 'f1', orderIndex, afterAction: 'next', ...extra };
}

function question(id: string, sectionId: string, orderIndex: number, extra: Partial<Question> = {}): Question {
  return {
    id,
    formId: 'f1',
    sectionId,
    title: id,
    isRequired: false,
    orderIndex,
    isActive: true,
    questionType: 'short_answer',
    settings: {},
    ...extra,
  } as Question; // test data: the extra fields never change the discriminant
}

const detail = (): FormDetail => ({
  form,
  sections: [section('s1', 0), section('s2', 1)],
  questions: [question('a', 's1', 0), question('b', 's1', 1), question('c', 's2', 0)],
});

const defaults = { title: 'Untitled', newId: () => 'new-id', optionLabel: (n: number) => `Option ${n}` };

const state = () => useFormEditorStore.getState();
const ids = (items: { id: string }[]) => items.map((item) => item.id);
const questionIdsOf = (sectionId: string) =>
  ids(
    (state().detail?.questions ?? [])
      .filter((item) => item.sectionId === sectionId)
      .sort((x, y) => x.orderIndex - y.orderIndex),
  );

beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers();
  state().resetAll();
  useFormEditorStore.setState({ detail: detail() });
});

afterEach(() => jest.useRealTimers());

describe('load', () => {
  it('loads the form detail and clears older state', async () => {
    jest.mocked(getFormDetail).mockResolvedValue(detail());
    useFormEditorStore.setState({ detail: undefined, saveState: 'error' });

    const promise = state().load('f1');
    expect(state().isLoading).toBe(true);
    await promise;

    expect(getFormDetail).toHaveBeenCalledWith('f1');
    expect(state()).toMatchObject({ isLoading: false, saveState: 'idle', errorKey: undefined });
    expect(state().detail?.form.id).toBe('f1');
  });

  it('keeps the error key when loading fails', async () => {
    jest.mocked(getFormDetail).mockRejectedValue(new ServiceError('notFound'));

    await state().load('nope');

    expect(state()).toMatchObject({ detail: undefined, errorKey: 'errors.notFound', isLoading: false });
  });
});

describe('open', () => {
  it('keeps the form that is already loaded', async () => {
    state().updateQuestion({ ...question('a', 's1', 0), title: 'Unsaved' });

    await state().open('f1');

    expect(getFormDetail).not.toHaveBeenCalled();
    expect(state().detail?.questions.find((item) => item.id === 'a')?.title).toBe('Unsaved');
  });

  it('saves pending edits, then loads another form', async () => {
    jest.mocked(updateQuestion).mockResolvedValue(question('a', 's1', 0));
    jest.mocked(getFormDetail).mockResolvedValue({ ...detail(), form: { ...form, id: 'f2' } });
    state().updateQuestion({ ...question('a', 's1', 0), title: 'Unsaved' });

    await state().open('f2');

    expect(updateQuestion).toHaveBeenCalledTimes(1);
    expect(getFormDetail).toHaveBeenCalledWith('f2');
    expect(state().detail?.form.id).toBe('f2');
  });

  it('loads when nothing is loaded yet', async () => {
    useFormEditorStore.setState({ detail: undefined });
    jest.mocked(getFormDetail).mockResolvedValue(detail());

    await state().open('f1');

    expect(getFormDetail).toHaveBeenCalledWith('f1');
  });
});

describe('debounced saving', () => {
  it('applies a question edit at once and saves it once after the pause', async () => {
    jest.mocked(updateQuestion).mockResolvedValue(question('a', 's1', 0));
    const original = question('a', 's1', 0);

    state().updateQuestion({ ...original, title: 'H' });
    state().updateQuestion({ ...original, title: 'He' });
    state().updateQuestion({ ...original, title: 'Hello' });

    expect(state().detail?.questions.find((item) => item.id === 'a')?.title).toBe('Hello');
    expect(state().saveState).toBe('dirty');
    expect(updateQuestion).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(SAVE_DELAY_MS);

    expect(updateQuestion).toHaveBeenCalledTimes(1);
    expect(updateQuestion).toHaveBeenCalledWith('a', expect.objectContaining({ title: 'Hello' }));
    expect(state().saveState).toBe('saved');
  });

  it('applies form edits at once and saves them merged', async () => {
    jest.mocked(updateForm).mockResolvedValue(form);

    state().updateForm({ title: 'New title' });
    state().updateForm({ showProgressBar: false });

    expect(state().detail?.form).toMatchObject({ title: 'New title', showProgressBar: false });
    await jest.advanceTimersByTimeAsync(SAVE_DELAY_MS);

    expect(updateForm).toHaveBeenCalledTimes(1);
    expect(updateForm).toHaveBeenCalledWith('f1', { title: 'New title', showProgressBar: false });
    expect(state().saveState).toBe('saved');
  });

  it('flushes immediately on request', async () => {
    jest.mocked(updateQuestion).mockResolvedValue(question('a', 's1', 0));
    state().updateQuestion({ ...question('a', 's1', 0), title: 'Now' });

    await state().flush();

    expect(updateQuestion).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(SAVE_DELAY_MS);
    expect(updateQuestion).toHaveBeenCalledTimes(1);
  });

  it('does nothing to flush when nothing changed', async () => {
    await state().flush();
    expect(state().saveState).toBe('idle');
  });

  it('shows the saving state while a save runs', async () => {
    let finish: () => void = () => undefined;
    jest.mocked(updateQuestion).mockReturnValue(new Promise((resolve) => (finish = () => resolve(question('a', 's1', 0)))));
    state().updateQuestion({ ...question('a', 's1', 0), title: 'Slow' });

    const flushing = state().flush();
    expect(state().saveState).toBe('saving');
    finish();
    await flushing;

    expect(state().saveState).toBe('saved');
  });

  it('keeps edits made during a save as dirty', async () => {
    let finish: () => void = () => undefined;
    jest.mocked(updateQuestion).mockReturnValue(new Promise((resolve) => (finish = () => resolve(question('a', 's1', 0)))));
    state().updateQuestion({ ...question('a', 's1', 0), title: 'First' });

    const flushing = state().flush();
    state().updateQuestion({ ...question('a', 's1', 0), title: 'Second' });
    finish();
    await flushing;

    expect(state().saveState).toBe('dirty');
  });

  it('reports a failed save and retries the same edits', async () => {
    jest.mocked(updateQuestion).mockRejectedValueOnce(new ServiceError('network')).mockResolvedValueOnce(question('a', 's1', 0));
    jest.mocked(updateForm).mockRejectedValueOnce(new ServiceError('network')).mockResolvedValueOnce(form);
    state().updateQuestion({ ...question('a', 's1', 0), title: 'Keep me' });
    state().updateForm({ title: 'Keep me too' });

    await state().flush();
    expect(state()).toMatchObject({ saveState: 'error', saveErrorKey: 'errors.network' });

    await state().flush();
    expect(updateQuestion).toHaveBeenLastCalledWith('a', expect.objectContaining({ title: 'Keep me' }));
    expect(updateForm).toHaveBeenLastCalledWith('f1', { title: 'Keep me too' });
    expect(state()).toMatchObject({ saveState: 'saved', saveErrorKey: undefined });
  });

  it('prefers newer edits over failed ones when retrying', async () => {
    let fail: (error: Error) => void = () => undefined;
    jest.mocked(updateQuestion).mockReturnValueOnce(new Promise((_, reject) => (fail = reject)));
    jest.mocked(updateQuestion).mockResolvedValue(question('a', 's1', 0));
    state().updateQuestion({ ...question('a', 's1', 0), title: 'Old' });
    const flushing = state().flush();

    state().updateQuestion({ ...question('a', 's1', 0), title: 'Newer' });
    fail(new Error('boom'));
    await flushing;
    await state().flush();

    expect(updateQuestion).toHaveBeenLastCalledWith('a', expect.objectContaining({ title: 'Newer' }));
  });

  it('requires a loaded form', () => {
    useFormEditorStore.setState({ detail: undefined });
    expect(() => state().updateForm({ title: 'x' })).toThrow(ServiceError);
  });

  it('drops pending edits when a question is removed', async () => {
    jest.mocked(removeQuestion).mockResolvedValue('deleted');
    state().updateQuestion({ ...question('a', 's1', 0), title: 'Edited' });

    await state().removeQuestion('a');
    await state().flush();

    expect(updateQuestion).not.toHaveBeenCalled();
  });
});

describe('editing section text', () => {
  it('applies the text at once and saves it once after the pause', async () => {
    jest.mocked(updateSection).mockResolvedValue(section('s1', 0));

    state().editSection('s1', { title: 'A' });
    state().editSection('s1', { description: 'About you' });
    state().editSection('s1', { title: 'About' });

    expect(state().detail?.sections.find((item) => item.id === 's1')).toMatchObject({ title: 'About', description: 'About you' });
    expect(updateSection).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(SAVE_DELAY_MS);

    expect(updateSection).toHaveBeenCalledTimes(1);
    expect(updateSection).toHaveBeenCalledWith('s1', { title: 'About', description: 'About you' });
    expect(state().saveState).toBe('saved');
  });

  it('keeps the text for a retry when saving fails', async () => {
    jest.mocked(updateSection).mockRejectedValueOnce(new ServiceError('network')).mockResolvedValueOnce(section('s1', 0));
    state().editSection('s1', { title: 'Keep me' });

    await state().flush();
    expect(state().saveState).toBe('error');

    await state().flush();
    expect(updateSection).toHaveBeenLastCalledWith('s1', { title: 'Keep me' });
    expect(state().saveState).toBe('saved');
  });

  it('prefers text typed during a failing save', async () => {
    let fail: (error: Error) => void = () => undefined;
    jest.mocked(updateSection).mockReturnValueOnce(new Promise((_, reject) => (fail = reject)));
    jest.mocked(updateSection).mockResolvedValue(section('s1', 0));
    state().editSection('s1', { title: 'Old' });
    const flushing = state().flush();

    state().editSection('s1', { title: 'Newer' });
    fail(new Error('boom'));
    await flushing;
    await state().flush();

    expect(updateSection).toHaveBeenLastCalledWith('s1', { title: 'Newer' });
  });
});

describe('sections', () => {
  it('adds a section at the end', async () => {
    jest.mocked(addSection).mockResolvedValue(section('s3', 2, { title: 'More' }));

    const added = await state().addSection('More');

    expect(addSection).toHaveBeenCalledWith({ formId: 'f1', title: 'More', orderIndex: 2, afterAction: 'next' });
    expect(added.id).toBe('s3');
    expect(ids(state().detail?.sections ?? [])).toEqual(['s1', 's2', 's3']);
  });

  it('updates a section with the stored result', async () => {
    jest.mocked(updateSection).mockResolvedValue(section('s1', 0, { afterAction: 'submit' }));

    await state().updateSection('s1', { afterAction: 'submit' });

    expect(updateSection).toHaveBeenCalledWith('s1', { afterAction: 'submit' });
    expect(state().detail?.sections.find((item) => item.id === 's1')?.afterAction).toBe('submit');
  });

  it('moves a section and stores the new order', async () => {
    jest.mocked(reorderSections).mockResolvedValue(undefined);

    await state().moveSection('s2', 'up');

    expect(reorderSections).toHaveBeenCalledWith(['s2', 's1']);
    expect(state().detail?.sections.map((item) => [item.id, item.orderIndex])).toEqual([
      ['s2', 0],
      ['s1', 1],
    ]);
  });

  it('does nothing when a section is already at the edge', async () => {
    await state().moveSection('s1', 'up');
    expect(reorderSections).not.toHaveBeenCalled();
  });

  it('restores the order when moving fails', async () => {
    jest.mocked(reorderSections).mockRejectedValue(new ServiceError('network'));

    await expect(state().moveSection('s2', 'up')).rejects.toMatchObject({ code: 'network' });

    expect(state().detail?.sections.map((item) => item.id)).toEqual(['s1', 's2']);
  });

  it('removes a section with its questions and resets jumps to it', async () => {
    useFormEditorStore.setState({
      detail: { ...detail(), sections: [section('s1', 0, { afterAction: 'goto', goToSectionId: 's2' }), section('s2', 1)] },
    });
    jest.mocked(deleteSection).mockResolvedValue(undefined);
    jest.mocked(updateSection).mockResolvedValue(section('s1', 0));
    jest.mocked(reorderSections).mockResolvedValue(undefined);

    await state().removeSection('s2');

    expect(deleteSection).toHaveBeenCalledWith('s2');
    expect(updateSection).toHaveBeenCalledWith('s1', { afterAction: 'next', goToSectionId: undefined });
    expect(reorderSections).toHaveBeenCalledWith(['s1']);
    expect(state().detail?.sections).toEqual([section('s1', 0)]);
    expect(ids(state().detail?.questions ?? [])).toEqual(['a', 'b']);
  });

  it('refuses to remove the last section', async () => {
    useFormEditorStore.setState({ detail: { ...detail(), sections: [section('s1', 0)] } });

    await expect(state().removeSection('s1')).rejects.toMatchObject({ code: 'invalidInput' });

    expect(deleteSection).not.toHaveBeenCalled();
  });

  it('keeps the section when it has answers', async () => {
    jest.mocked(deleteSection).mockRejectedValue(new ServiceError('inUse'));

    await expect(state().removeSection('s2')).rejects.toMatchObject({ code: 'inUse' });

    expect(ids(state().detail?.sections ?? [])).toEqual(['s1', 's2']);
  });
});

describe('questions', () => {
  it('adds a default question at the end of its section', async () => {
    jest.mocked(addQuestion).mockImplementation(async (draft) => ({ ...draft, id: 'new' }) as Question); // test double echoes the draft

    const added = await state().addQuestion('s1', 'multiple_choice', defaults);

    expect(addQuestion).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: 's1', formId: 'f1', orderIndex: 2, title: 'Untitled', questionType: 'multiple_choice' }),
    );
    expect(added.id).toBe('new');
    expect(questionIdsOf('s1')).toEqual(['a', 'b', 'new']);
  });

  it('moves a question within its section', async () => {
    jest.mocked(reorderQuestions).mockResolvedValue(undefined);

    await state().moveQuestion('b', 'up');

    expect(reorderQuestions).toHaveBeenCalledWith(['b', 'a']);
    expect(questionIdsOf('s1')).toEqual(['b', 'a']);
    expect(questionIdsOf('s2')).toEqual(['c']);
  });

  it('ignores moves at the edge and for unknown questions', async () => {
    await state().moveQuestion('a', 'up');
    await state().moveQuestion('zzz', 'down');
    expect(reorderQuestions).not.toHaveBeenCalled();
  });

  it('restores the order when moving fails', async () => {
    jest.mocked(reorderQuestions).mockRejectedValue(new ServiceError('network'));

    await expect(state().moveQuestion('b', 'up')).rejects.toMatchObject({ code: 'network' });

    expect(questionIdsOf('s1')).toEqual(['a', 'b']);
  });

  it('duplicates a question right after the original', async () => {
    jest.mocked(duplicateQuestion).mockResolvedValue(question('copy', 's1', 1));
    jest.mocked(reorderQuestions).mockResolvedValue(undefined);

    await state().duplicateQuestion('a');

    expect(questionIdsOf('s1')).toEqual(['a', 'copy', 'b']);
    expect(reorderQuestions).toHaveBeenCalledWith(['a', 'copy', 'b']);
  });

  it('ignores duplicating an unknown question', async () => {
    await state().duplicateQuestion('zzz');
    expect(duplicateQuestion).not.toHaveBeenCalled();
  });

  it('removes a deleted question and renumbers its section', async () => {
    jest.mocked(removeQuestion).mockResolvedValue('deleted');

    await expect(state().removeQuestion('a')).resolves.toBe('deleted');

    expect(state().detail?.questions.find((item) => item.sectionId === 's1')).toMatchObject({ id: 'b', orderIndex: 0 });
    expect(questionIdsOf('s2')).toEqual(['c']);
  });

  it('keeps a question that has answers as deactivated', async () => {
    jest.mocked(removeQuestion).mockResolvedValue('deactivated');

    await expect(state().removeQuestion('a')).resolves.toBe('deactivated');

    expect(state().detail?.questions.find((item) => item.id === 'a')?.isActive).toBe(false);
  });

  it('handles removing a question that is not in the editor', async () => {
    jest.mocked(removeQuestion).mockResolvedValue('deleted');
    await expect(state().removeQuestion('zzz')).resolves.toBe('deleted');
    expect(state().detail?.questions).toHaveLength(3);
  });
});

describe('publish and archive', () => {
  it('saves pending edits, then publishes', async () => {
    jest.mocked(updateQuestion).mockResolvedValue(question('a', 's1', 0));
    jest.mocked(publishForm).mockResolvedValue({ ...form, status: 'published' });
    state().updateQuestion({ ...question('a', 's1', 0), title: 'Last edit' });

    await state().publish();

    expect(updateQuestion).toHaveBeenCalledTimes(1);
    expect(publishForm).toHaveBeenCalledWith('f1');
    expect(state().detail?.form.status).toBe('published');
  });

  it('does not publish when saving the last edits failed', async () => {
    jest.mocked(updateQuestion).mockRejectedValue(new ServiceError('network'));
    state().updateQuestion({ ...question('a', 's1', 0), title: 'Unsaved' });

    await expect(state().publish()).rejects.toBeInstanceOf(ServiceError);

    expect(publishForm).not.toHaveBeenCalled();
  });

  it('reports a form that cannot be published', async () => {
    jest.mocked(publishForm).mockRejectedValue(new ServiceError('invalidInput'));
    await expect(state().publish()).rejects.toMatchObject({ code: 'invalidInput' });
    expect(state().detail?.form.status).toBe('draft');
  });

  it('archives the form', async () => {
    jest.mocked(archiveForm).mockResolvedValue({ ...form, status: 'archived' });

    await state().archive();

    expect(state().detail?.form.status).toBe('archived');
  });
});

describe('question images', () => {
  const photo = { uri: 'file:///p.png', name: 'p.png', mimeType: 'image/png', size: 1000 };

  beforeEach(() => {
    jest.mocked(uploadQuestionImage).mockResolvedValue('f1/a/1-p.png');
    jest.mocked(deleteFiles).mockResolvedValue(undefined);
    jest.mocked(updateQuestion).mockResolvedValue(question('a', 's1', 0));
  });

  it('uploads the image and saves its path on the question', async () => {
    await state().attachImage('a', photo);

    expect(uploadQuestionImage).toHaveBeenCalledWith('f1', 'a', photo);
    expect(updateQuestion).toHaveBeenCalledWith('a', expect.objectContaining({ imagePath: 'f1/a/1-p.png' }));
    expect(state().detail?.questions.find((item) => item.id === 'a')?.imagePath).toBe('f1/a/1-p.png');
    expect(deleteFiles).not.toHaveBeenCalled();
  });

  it('deletes the previous image when it is replaced, and survives a failing delete', async () => {
    useFormEditorStore.setState({ detail: { ...detail(), questions: [{ ...question('a', 's1', 0), imagePath: 'old.png' }, question('b', 's1', 1)] } });
    jest.mocked(deleteFiles).mockRejectedValue(new ServiceError('network'));

    await expect(state().attachImage('a', photo)).resolves.toBeUndefined();

    expect(deleteFiles).toHaveBeenCalledWith('form-media', ['old.png']);
  });

  it.each([
    ['not an image', { ...photo, mimeType: 'application/pdf', name: 'a.pdf' }],
    ['larger than 5 MB', { ...photo, size: 6 * 1024 * 1024 }],
  ])('refuses a file that is %s', async (_name, file) => {
    await expect(state().attachImage('a', file)).rejects.toMatchObject({ code: 'invalidInput' });
    expect(uploadQuestionImage).not.toHaveBeenCalled();
  });

  it('ignores an unknown question', async () => {
    await state().attachImage('zzz', photo);
    await state().removeImage('zzz');
    expect(uploadQuestionImage).not.toHaveBeenCalled();
  });

  it('removes the image from storage and from the question', async () => {
    useFormEditorStore.setState({ detail: { ...detail(), questions: [{ ...question('a', 's1', 0), imagePath: 'x.png' }] } });

    await state().removeImage('a');

    expect(deleteFiles).toHaveBeenCalledWith('form-media', ['x.png']);
    expect(state().detail?.questions[0].imagePath).toBeUndefined();
    expect(updateQuestion).toHaveBeenCalledWith('a', expect.objectContaining({ imagePath: undefined }));
  });

  it('does nothing for a question without an image', async () => {
    await state().removeImage('a');
    expect(deleteFiles).not.toHaveBeenCalled();
  });

  it('keeps the image when deleting the file fails', async () => {
    useFormEditorStore.setState({ detail: { ...detail(), questions: [{ ...question('a', 's1', 0), imagePath: 'x.png' }] } });
    jest.mocked(deleteFiles).mockRejectedValue(new ServiceError('forbidden'));
    await expect(state().removeImage('a')).rejects.toMatchObject({ code: 'forbidden' });
    expect(state().detail?.questions[0].imagePath).toBe('x.png');
  });
});

describe('logout', () => {
  it('is cleared with all stores and cancels pending saves', async () => {
    state().updateQuestion({ ...question('a', 's1', 0), title: 'Unsaved' });

    resetAllStores();
    await jest.advanceTimersByTimeAsync(SAVE_DELAY_MS);

    expect(state().detail).toBeUndefined();
    expect(updateQuestion).not.toHaveBeenCalled();
  });
});
