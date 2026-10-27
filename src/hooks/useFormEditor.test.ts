import { act, renderHook } from '@testing-library/react-native';
import { useFormEditor } from '@/hooks/useFormEditor';
import { ServiceError } from '@/services/errors';
import { makeDetail, makeQuestion } from '@/testUtils/factories';

const mockStore = {
  detail: makeDetail() as ReturnType<typeof makeDetail> | undefined,
  isLoading: false,
  errorKey: undefined as string | undefined,
  saveState: 'idle',
  saveErrorKey: undefined as string | undefined,
  load: jest.fn(),
  flush: jest.fn(),
  updateForm: jest.fn(),
  updateQuestion: jest.fn(),
  moveQuestion: jest.fn(),
  duplicateQuestion: jest.fn(),
  removeQuestion: jest.fn(),
  addQuestion: jest.fn(),
};

jest.mock('@/state/useFormEditorStore', () => {
  const useFormEditorStore = (selector: (state: typeof mockStore) => unknown) => selector(mockStore);
  useFormEditorStore.getState = () => mockStore;
  return { useFormEditorStore };
});
jest.mock('expo-crypto', () => ({ randomUUID: () => 'generated-id' }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: { n?: number }) => (options?.n === undefined ? key : `${key}:${options.n}`) }),
}));

beforeEach(() => {
  jest.useFakeTimers();
  mockStore.detail = makeDetail();
  mockStore.errorKey = undefined;
  mockStore.load = jest.fn().mockResolvedValue(undefined);
  mockStore.flush = jest.fn().mockResolvedValue(undefined);
  mockStore.updateForm = jest.fn();
  mockStore.updateQuestion = jest.fn();
  mockStore.moveQuestion = jest.fn().mockResolvedValue(undefined);
  mockStore.duplicateQuestion = jest.fn().mockResolvedValue(undefined);
  mockStore.removeQuestion = jest.fn().mockResolvedValue('deleted');
  mockStore.addQuestion = jest.fn().mockResolvedValue(undefined);
});

afterEach(() => jest.useRealTimers());

describe('useFormEditor', () => {
  it('loads the form on mount and saves pending edits on leave', () => {
    const { unmount } = renderHook(() => useFormEditor('f1'));
    expect(mockStore.load).toHaveBeenCalledWith('f1');
    unmount();
    expect(mockStore.flush).toHaveBeenCalledTimes(1);
  });

  it('exposes store state and reloads on demand', () => {
    mockStore.errorKey = 'errors.notFound';
    const { result } = renderHook(() => useFormEditor('f1'));
    expect(result.current.detail).toBe(mockStore.detail);
    expect(result.current.errorKey).toBe('errors.notFound');
    act(() => result.current.reload());
    expect(mockStore.load).toHaveBeenCalledTimes(2);
  });

  it('passes edits and retries to the store', () => {
    const { result } = renderHook(() => useFormEditor('f1'));
    const question = makeQuestion('a');
    act(() => result.current.changeForm({ title: 'New' }));
    act(() => result.current.questionHandlers.onChange(question));
    act(() => result.current.retrySave());
    expect(mockStore.updateForm).toHaveBeenCalledWith({ title: 'New' });
    expect(mockStore.updateQuestion).toHaveBeenCalledWith(question);
    expect(mockStore.flush).toHaveBeenCalled();
  });

  it('moves and duplicates questions', async () => {
    const { result } = renderHook(() => useFormEditor('f1'));
    await act(async () => result.current.questionHandlers.onMove('a', 'down'));
    await act(async () => result.current.questionHandlers.onDuplicate('a'));
    expect(mockStore.moveQuestion).toHaveBeenCalledWith('a', 'down');
    expect(mockStore.duplicateQuestion).toHaveBeenCalledWith('a');
  });

  it('shows the error of a failed action and hides it after a while', async () => {
    mockStore.moveQuestion.mockRejectedValue(new ServiceError('network'));
    const { result } = renderHook(() => useFormEditor('f1'));

    await act(async () => result.current.questionHandlers.onMove('a', 'down'));
    expect(result.current.actionErrorKey).toBe('errors.network');

    act(() => void jest.advanceTimersByTime(4000));
    expect(result.current.actionErrorKey).toBeUndefined();
  });

  it('dismisses messages on request', async () => {
    mockStore.moveQuestion.mockRejectedValue(new ServiceError('network'));
    const { result } = renderHook(() => useFormEditor('f1'));
    await act(async () => result.current.questionHandlers.onMove('a', 'down'));

    act(() => result.current.dismissMessages());

    expect(result.current.actionErrorKey).toBeUndefined();
  });

  describe('adding questions', () => {
    it('picks a section, then a type, and adds a translated default question', async () => {
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.openPicker('s2'));
      expect(result.current.pickerSectionId).toBe('s2');

      await act(async () => result.current.addQuestion('dropdown'));

      expect(result.current.pickerSectionId).toBeUndefined();
      const [sectionId, type, defaults] = mockStore.addQuestion.mock.calls[0];
      expect([sectionId, type]).toEqual(['s2', 'dropdown']);
      expect(defaults.title).toBe('editor.newQuestionTitle');
      expect(defaults.optionLabel(3)).toBe('editor.optionLabel:3');
      expect(defaults.newId()).toBe('generated-id');
    });

    it('does nothing when no section is selected', async () => {
      const { result } = renderHook(() => useFormEditor('f1'));
      await act(async () => result.current.addQuestion('dropdown'));
      expect(mockStore.addQuestion).not.toHaveBeenCalled();
    });

    it('can close the picker', () => {
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.openPicker('s1'));
      act(() => result.current.closePicker());
      expect(result.current.pickerSectionId).toBeUndefined();
    });
  });

  describe('deleting questions', () => {
    it('asks first, then deletes', async () => {
      const question = makeQuestion('a');
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.questionHandlers.onDelete(question));
      expect(result.current.deleteTarget).toBe(question);
      expect(mockStore.removeQuestion).not.toHaveBeenCalled();

      await act(async () => result.current.confirmDelete());

      expect(mockStore.removeQuestion).toHaveBeenCalledWith('a');
      expect(result.current.deleteTarget).toBeUndefined();
      expect(result.current.noticeKey).toBeUndefined();
    });

    it('explains when the question was deactivated instead', async () => {
      mockStore.removeQuestion.mockResolvedValue('deactivated');
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.questionHandlers.onDelete(makeQuestion('a')));

      await act(async () => result.current.confirmDelete());

      expect(result.current.noticeKey).toBe('editor.deactivatedNotice');
    });

    it('can be cancelled', async () => {
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.questionHandlers.onDelete(makeQuestion('a')));
      act(() => result.current.cancelDelete());
      await act(async () => result.current.confirmDelete());
      expect(mockStore.removeQuestion).not.toHaveBeenCalled();
    });

    it('shows an error when deleting fails', async () => {
      mockStore.removeQuestion.mockRejectedValue(new ServiceError('forbidden'));
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.questionHandlers.onDelete(makeQuestion('a')));

      await act(async () => result.current.confirmDelete());

      expect(result.current.actionErrorKey).toBe('errors.forbidden');
      expect(result.current.isWorking).toBe(false);
    });
  });
});
