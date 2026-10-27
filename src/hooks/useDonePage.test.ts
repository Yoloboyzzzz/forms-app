import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useDonePage } from '@/hooks/useDonePage';
import { ServiceError } from '@/services/errors';
import { getFillData, reopenSubmission } from '@/services/submissionService';
import { useFillStore } from '@/state/useFillStore';
import { makeDetail, makeForm } from '@/testUtils/factories';
import type { Submission } from '@/types/models';

jest.mock('@/services/storageService', () => ({ deleteFiles: jest.fn(), uploadAnswerFile: jest.fn() }));
jest.mock('@/services/submissionService', () => ({
  deleteAnswer: jest.fn(),
  getFillData: jest.fn(),
  getOrCreateDraft: jest.fn(),
  reopenSubmission: jest.fn(),
  saveAnswer: jest.fn(),
  submitSubmission: jest.fn(),
}));

const submitted: Submission = { id: 'sub1', assignmentId: 'a1', status: 'submitted', createdAt: new Date(0), updatedAt: new Date(0) };

function mockData(): void {
  jest.mocked(getFillData).mockResolvedValue({
    assignment: { id: 'a1', formId: 'f1', userId: 'me', assignedBy: 'admin', assignedAt: new Date(0) },
    detail: makeDetail({ form: makeForm({ allowEditAfterSubmit: true }) }),
    submission: submitted,
    answers: {},
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  useFillStore.getState().resetAll();
  mockData();
});

describe('useDonePage', () => {
  it('loads the assignment when the page is opened directly', async () => {
    const { result } = renderHook(() => useDonePage('a1'));
    await waitFor(() => expect(result.current.isSubmitted).toBe(true));
    expect(getFillData).toHaveBeenCalledWith('a1');
    expect(result.current.form?.allowEditAfterSubmit).toBe(true);
  });

  it('does not load again when the store already holds the assignment', async () => {
    await useFillStore.getState().load('a1');
    jest.mocked(getFillData).mockClear();

    const { result } = renderHook(() => useDonePage('a1'));

    expect(getFillData).not.toHaveBeenCalled();
    expect(result.current.isSubmitted).toBe(true);
  });

  it('exposes a load error', async () => {
    jest.mocked(getFillData).mockRejectedValue(new ServiceError('notFound'));
    const { result } = renderHook(() => useDonePage('nope'));
    await waitFor(() => expect(result.current.errorKey).toBe('errors.notFound'));
  });

  it('reopens the response for editing', async () => {
    jest.mocked(reopenSubmission).mockResolvedValue({ ...submitted, status: 'draft' });
    const { result } = renderHook(() => useDonePage('a1'));
    await waitFor(() => expect(result.current.isSubmitted).toBe(true));

    let ok = false;
    await act(async () => {
      ok = await result.current.edit();
    });

    expect(ok).toBe(true);
    expect(result.current.isEditing).toBe(false);
    expect(useFillStore.getState().submission?.status).toBe('draft');
  });

  it('shows why editing is not possible', async () => {
    jest.mocked(reopenSubmission).mockRejectedValue(new ServiceError('forbidden'));
    const { result } = renderHook(() => useDonePage('a1'));
    await waitFor(() => expect(result.current.isSubmitted).toBe(true));

    let ok = true;
    await act(async () => {
      ok = await result.current.edit();
    });

    expect(ok).toBe(false);
    expect(result.current.editErrorKey).toBe('errors.forbidden');
  });
});
