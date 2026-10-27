import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useFillForm } from '@/hooks/useFillForm';
import { ServiceError } from '@/services/errors';
import { getFillData, getOrCreateDraft, saveAnswer, submitSubmission } from '@/services/submissionService';
import { useFillStore } from '@/state/useFillStore';
import { makeDetail, makeForm, makeQuestion, makeSection } from '@/testUtils/factories';
import type { FormDetail, Submission } from '@/types/models';

let mockOnline = true;

jest.mock('@/hooks/useIsOnline', () => ({ useIsOnline: () => mockOnline }));
jest.mock('@/services/storageService', () => ({ deleteFiles: jest.fn(), uploadAnswerFile: jest.fn() }));
jest.mock('@/services/submissionService', () => ({
  deleteAnswer: jest.fn(),
  getFillData: jest.fn(),
  getOrCreateDraft: jest.fn(),
  reopenSubmission: jest.fn(),
  saveAnswer: jest.fn(),
  submitSubmission: jest.fn(),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const draft: Submission = { id: 'sub1', assignmentId: 'a1', status: 'draft', createdAt: new Date(0), updatedAt: new Date(0) };
const submitted: Submission = { ...draft, status: 'submitted' };

const required = makeQuestion('a', { title: 'Name', isRequired: true });
const optional = makeQuestion('b', { orderIndex: 1 });
const second = makeQuestion('c', { sectionId: 's2' });

function detail(extra: Partial<FormDetail> = {}): FormDetail {
  return makeDetail({ questions: [required, optional, second], ...extra });
}

async function setup(extra: Partial<FormDetail> = {}, submission?: Submission) {
  jest.mocked(getFillData).mockResolvedValue({
    assignment: { id: 'a1', formId: 'f1', userId: 'me', assignedBy: 'admin', assignedAt: new Date(0) },
    detail: detail(extra),
    submission,
    answers: {},
  });
  const hook = renderHook(() => useFillForm({ assignmentId: 'a1' }));
  await waitFor(() => expect(hook.result.current.section).toBeDefined());
  return hook;
}

beforeEach(() => {
  jest.resetAllMocks();
  mockOnline = true;
  useFillStore.getState().resetAll();
  jest.mocked(getOrCreateDraft).mockResolvedValue(draft);
  jest.mocked(saveAnswer).mockResolvedValue(undefined);
  jest.mocked(submitSubmission).mockResolvedValue(submitted);
});

describe('loading', () => {
  it('loads the assignment and shows the first section', async () => {
    const { result } = await setup();
    expect(getFillData).toHaveBeenCalledWith('a1');
    expect(result.current.section?.id).toBe('s1');
    expect(result.current.questions.map((q) => q.id)).toEqual(['a', 'b']);
    expect(result.current.position).toEqual({ current: 1, total: 2 });
    expect(result.current.isPreview).toBe(false);
  });

  it('exposes a load error and can retry', async () => {
    jest.mocked(getFillData).mockRejectedValueOnce(new ServiceError('notFound'));
    const { result } = renderHook(() => useFillForm({ assignmentId: 'a1' }));
    await waitFor(() => expect(result.current.errorKey).toBe('errors.notFound'));

    jest.mocked(getFillData).mockResolvedValue({
      assignment: { id: 'a1', formId: 'f1', userId: 'me', assignedBy: 'admin', assignedAt: new Date(0) },
      detail: detail(),
      answers: {},
    });
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.section).toBeDefined());
  });

  it('shows a closed form when nothing was answered', async () => {
    const { result } = await setup({ form: makeForm({ isAcceptingResponses: false }) });
    expect(result.current.isClosed).toBe(true);
  });

  it('keeps an already started response open even if the form closed', async () => {
    const { result } = await setup({ form: makeForm({ isAcceptingResponses: false }) }, draft);
    expect(result.current.isClosed).toBe(false);
  });

  it('reports a submitted response', async () => {
    const { result } = await setup({}, submitted);
    expect(result.current.isSubmitted).toBe(true);
  });

  it('shuffles the questions of a section when the form asks for it, the same way each time', async () => {
    const many = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].map((id, index) => makeQuestion(id, { orderIndex: index }));
    const { result, rerender } = await setup({ form: makeForm({ shuffleQuestionOrder: true }), questions: many });
    const first = result.current.questions.map((q) => q.id);
    rerender({});
    expect(result.current.questions.map((q) => q.id)).toEqual(first);
    expect([...first].sort()).toEqual(['q1', 'q2', 'q3', 'q4', 'q5', 'q6']);
  });

  it('keeps the model order unless the form asks for shuffling', async () => {
    const { result } = await setup();
    expect(result.current.questions.map((q) => q.id)).toEqual(['a', 'b']);
  });
});

describe('preview', () => {
  it('shows the given form without loading or saving anything', async () => {
    const preview = detail();
    const { result } = renderHook(() => useFillForm({ preview }));
    await waitFor(() => expect(result.current.section).toBeDefined());

    act(() => result.current.setAnswer(required, 'x'));

    expect(getFillData).not.toHaveBeenCalled();
    expect(result.current.isPreview).toBe(true);
    expect(saveAnswer).not.toHaveBeenCalled();
  });

  it('reaches the end of the preview instead of asking to submit', async () => {
    const preview = detail({ sections: [makeSection('s1', 0)], questions: [optional] });
    const { result } = renderHook(() => useFillForm({ preview }));
    await waitFor(() => expect(result.current.section).toBeDefined());

    act(() => result.current.next());

    expect(result.current.previewFinished).toBe(true);
    expect(result.current.isConfirming).toBe(false);
  });

  it('goes back out of the finished preview', async () => {
    const preview = detail({ sections: [makeSection('s1', 0)], questions: [optional] });
    const { result } = renderHook(() => useFillForm({ preview }));
    await waitFor(() => expect(result.current.section).toBeDefined());
    act(() => result.current.next());

    act(() => result.current.back());

    expect(result.current.previewFinished).toBe(false);
  });

  it('reload does nothing for a preview', async () => {
    const preview = detail();
    const { result } = renderHook(() => useFillForm({ preview }));
    await waitFor(() => expect(result.current.section).toBeDefined());
    act(() => result.current.reload());
    expect(getFillData).not.toHaveBeenCalled();
  });
});

describe('moving between sections', () => {
  it('blocks next while a required question is unanswered, then shows the error', async () => {
    const { result } = await setup();
    expect(result.current.errors).toEqual({});

    act(() => result.current.next());

    expect(result.current.section?.id).toBe('s1');
    expect(result.current.errors).toEqual({ a: 'fill.required' });
  });

  it('removes the error as soon as the question is answered', async () => {
    const { result } = await setup();
    act(() => result.current.next());

    act(() => result.current.setAnswer(required, 'Ann'));

    await waitFor(() => expect(result.current.errors).toEqual({}));
  });

  it('goes to the next section once everything is fine, and back again', async () => {
    const { result } = await setup();
    act(() => result.current.setAnswer(required, 'Ann'));

    act(() => result.current.next());
    expect(result.current.section?.id).toBe('s2');
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.isLastSection).toBe(true);
    expect(result.current.position).toEqual({ current: 2, total: 2 });

    act(() => result.current.back());
    expect(result.current.section?.id).toBe('s1');
    expect(result.current.canGoBack).toBe(false);
  });

  it('shows a custom validation message the admin wrote', async () => {
    const ruled = makeQuestion('a', {
      settings: { validation: { kind: 'length', operator: 'max', value: 2, errorMessage: 'Too long!' } },
    });
    const { result } = await setup({ questions: [ruled] });
    act(() => result.current.setAnswer(ruled, 'abcdef'));

    act(() => result.current.next());

    expect(result.current.errors).toEqual({ a: 'Too long!' });
  });

  it('shows the default message of a validation rule', async () => {
    const ruled = makeQuestion('a', { settings: { validation: { kind: 'length', operator: 'max', value: 2 } } });
    const { result } = await setup({ questions: [ruled] });
    act(() => result.current.setAnswer(ruled, 'abcdef'));

    act(() => result.current.next());

    expect(result.current.errors).toEqual({ a: 'validation.rule.length.max' });
  });
});

describe('submitting', () => {
  async function atLastSection() {
    const hook = await setup({ sections: [makeSection('s1', 0)], questions: [required] });
    act(() => hook.result.current.setAnswer(required, 'Ann'));
    return hook;
  }

  it('asks for confirmation in the last section, then submits', async () => {
    const { result } = await atLastSection();
    expect(result.current.isLastSection).toBe(true);

    act(() => result.current.next());
    expect(result.current.isConfirming).toBe(true);
    expect(submitSubmission).not.toHaveBeenCalled();

    await act(async () => result.current.confirmSubmit());

    expect(saveAnswer).toHaveBeenCalledWith('sub1', 'a', 'Ann');
    expect(submitSubmission).toHaveBeenCalledWith('sub1');
    expect(result.current).toMatchObject({ isConfirming: false, isSubmitted: true, submitErrorKey: undefined });
  });

  it('can be cancelled', async () => {
    const { result } = await atLastSection();
    act(() => result.current.next());
    act(() => result.current.cancelSubmit());
    expect(result.current.isConfirming).toBe(false);
  });

  it('does not ask while a required question is unanswered', async () => {
    const { result } = await setup({ sections: [makeSection('s1', 0)], questions: [required] });
    act(() => result.current.next());
    expect(result.current.isConfirming).toBe(false);
    expect(result.current.errors).toEqual({ a: 'fill.required' });
  });

  it('shows why submitting failed', async () => {
    jest.mocked(submitSubmission).mockRejectedValue(new ServiceError('missingRequired'));
    const { result } = await atLastSection();
    act(() => result.current.next());

    await act(async () => result.current.confirmSubmit());

    expect(result.current).toMatchObject({ isConfirming: false, submitErrorKey: 'errors.missingRequired', isSubmitted: false });
  });

  it('clears the old submit error on the next attempt', async () => {
    jest.mocked(submitSubmission).mockRejectedValueOnce(new ServiceError('network'));
    const { result } = await atLastSection();
    act(() => result.current.next());
    await act(async () => result.current.confirmSubmit());

    act(() => result.current.next());

    expect(result.current.submitErrorKey).toBeUndefined();
  });
});

describe('connection and saving', () => {
  it('passes the connection state to the store', async () => {
    mockOnline = false;
    const { result } = await setup();
    expect(result.current.isOnline).toBe(false);
    expect(useFillStore.getState().isOnline).toBe(false);
  });

  it('retries saving on request', async () => {
    const { result } = await setup({}, draft);
    jest.mocked(saveAnswer).mockRejectedValueOnce(new ServiceError('network'));
    act(() => result.current.setAnswer(required, 'Ann'));
    await act(async () => useFillStore.getState().flush());
    expect(result.current.saveState).toBe('error');

    await act(async () => result.current.retrySave());

    await waitFor(() => expect(result.current.saveState).toBe('saved'));
  });

  it('saves pending answers when leaving the screen', async () => {
    const { result, unmount } = await setup({}, draft);
    act(() => result.current.setAnswer(required, 'Ann'));
    unmount();
    await waitFor(() => expect(saveAnswer).toHaveBeenCalledWith('sub1', 'a', 'Ann'));
  });
});
