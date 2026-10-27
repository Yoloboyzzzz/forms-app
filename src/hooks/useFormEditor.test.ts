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
  open: jest.fn(),
  flush: jest.fn(),
  updateForm: jest.fn(),
  updateQuestion: jest.fn(),
  moveQuestion: jest.fn(),
  duplicateQuestion: jest.fn(),
  removeQuestion: jest.fn(),
  addQuestion: jest.fn(),
  editSection: jest.fn(),
  updateSection: jest.fn(),
  moveSection: jest.fn(),
  addSection: jest.fn(),
  removeSection: jest.fn(),
  publish: jest.fn(),
  archive: jest.fn(),
};
const mockForms = { duplicate: jest.fn() };
const mockAuth: { session?: { userId: string } } = { session: { userId: 'u1' } };

jest.mock('@/state/useFormEditorStore', () => {
  const useFormEditorStore = (selector: (state: typeof mockStore) => unknown) => selector(mockStore);
  useFormEditorStore.getState = () => mockStore;
  return { useFormEditorStore };
});
jest.mock('@/state/useFormsStore', () => ({
  useFormsStore: (selector: (state: typeof mockForms) => unknown) => selector(mockForms),
}));
jest.mock('@/state/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof mockAuth) => unknown) => selector(mockAuth),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'generated-id' }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: { n?: number }) => (options?.n === undefined ? key : `${key}:${options.n}`) }),
}));

beforeEach(() => {
  jest.useFakeTimers();
  mockStore.detail = makeDetail();
  mockStore.errorKey = undefined;
  mockStore.load = jest.fn().mockResolvedValue(undefined);
  mockStore.open = jest.fn().mockResolvedValue(undefined);
  mockStore.flush = jest.fn().mockResolvedValue(undefined);
  mockStore.updateForm = jest.fn();
  mockStore.updateQuestion = jest.fn();
  mockStore.moveQuestion = jest.fn().mockResolvedValue(undefined);
  mockStore.duplicateQuestion = jest.fn().mockResolvedValue(undefined);
  mockStore.removeQuestion = jest.fn().mockResolvedValue('deleted');
  mockStore.addQuestion = jest.fn().mockResolvedValue(undefined);
  mockStore.editSection = jest.fn();
  mockStore.updateSection = jest.fn().mockResolvedValue(undefined);
  mockStore.moveSection = jest.fn().mockResolvedValue(undefined);
  mockStore.addSection = jest.fn().mockResolvedValue(undefined);
  mockStore.removeSection = jest.fn().mockResolvedValue(undefined);
  mockStore.publish = jest.fn().mockResolvedValue(undefined);
  mockStore.archive = jest.fn().mockResolvedValue(undefined);
  mockForms.duplicate = jest.fn().mockResolvedValue({ id: 'copy' });
  mockAuth.session = { userId: 'u1' };
});

afterEach(() => jest.useRealTimers());

describe('useFormEditor', () => {
  it('loads the form on mount and saves pending edits on leave', () => {
    const { unmount } = renderHook(() => useFormEditor('f1'));
    expect(mockStore.open).toHaveBeenCalledWith('f1');
    unmount();
    expect(mockStore.flush).toHaveBeenCalledTimes(1);
  });

  it('exposes store state and reloads on demand', () => {
    mockStore.errorKey = 'errors.notFound';
    const { result } = renderHook(() => useFormEditor('f1'));
    expect(result.current.detail).toBe(mockStore.detail);
    expect(result.current.errorKey).toBe('errors.notFound');
    act(() => result.current.reload());
    expect(mockStore.load).toHaveBeenCalledWith('f1');
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

  describe('sections', () => {
    it('passes typing and "after this section" changes to the store', async () => {
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.sectionHandlers.onEdit('s1', { title: 'About' }));
      await act(async () => result.current.sectionHandlers.onChangeAfter('s1', { afterAction: 'submit' }));
      expect(mockStore.editSection).toHaveBeenCalledWith('s1', { title: 'About' });
      expect(mockStore.updateSection).toHaveBeenCalledWith('s1', { afterAction: 'submit' });
    });

    it('moves and adds sections', async () => {
      const { result } = renderHook(() => useFormEditor('f1'));
      await act(async () => result.current.sectionHandlers.onMove('s1', 'down'));
      await act(async () => result.current.addSection());
      expect(mockStore.moveSection).toHaveBeenCalledWith('s1', 'down');
      expect(mockStore.addSection).toHaveBeenCalledTimes(1);
    });

    it('asks before deleting a section', async () => {
      const section = { id: 's2', formId: 'f1', orderIndex: 1, afterAction: 'next' as const };
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.sectionHandlers.onDelete(section));
      expect(result.current.sectionToDelete).toBe(section);
      expect(mockStore.removeSection).not.toHaveBeenCalled();

      await act(async () => result.current.confirmDeleteSection());

      expect(mockStore.removeSection).toHaveBeenCalledWith('s2');
      expect(result.current.sectionToDelete).toBeUndefined();
    });

    it('can cancel deleting a section', async () => {
      const section = { id: 's2', formId: 'f1', orderIndex: 1, afterAction: 'next' as const };
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.sectionHandlers.onDelete(section));
      act(() => result.current.cancelDeleteSection());
      await act(async () => result.current.confirmDeleteSection());
      expect(mockStore.removeSection).not.toHaveBeenCalled();
    });

    it('shows why a section could not be deleted', async () => {
      mockStore.removeSection.mockRejectedValue(new ServiceError('inUse'));
      const section = { id: 's2', formId: 'f1', orderIndex: 1, afterAction: 'next' as const };
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.sectionHandlers.onDelete(section));

      await act(async () => result.current.confirmDeleteSection());

      expect(result.current.actionErrorKey).toBe('errors.inUse');
    });
  });

  describe('publish, archive and duplicate', () => {
    it('asks first, then publishes and says so', async () => {
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.requestAction('publish'));
      expect(result.current.pendingAction).toBe('publish');
      expect(mockStore.publish).not.toHaveBeenCalled();

      await act(async () => result.current.confirmAction());

      expect(mockStore.publish).toHaveBeenCalledTimes(1);
      expect(result.current).toMatchObject({ pendingAction: undefined, noticeKey: 'editor.published', noticeVariant: 'success' });
    });

    it('archives', async () => {
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.requestAction('archive'));
      await act(async () => result.current.confirmAction());
      expect(mockStore.archive).toHaveBeenCalledTimes(1);
      expect(result.current.noticeKey).toBe('editor.archived');
    });

    it('duplicates with a translated title and reports the copy', async () => {
      const onDuplicated = jest.fn();
      const { result } = renderHook(() => useFormEditor('f1', { onDuplicated }));
      act(() => result.current.requestAction('duplicate'));

      await act(async () => result.current.confirmAction());

      expect(mockStore.flush).toHaveBeenCalled();
      expect(mockForms.duplicate).toHaveBeenCalledWith('f1', 'editor.copyTitle', 'u1');
      expect(onDuplicated).toHaveBeenCalledWith('copy');
      expect(result.current.noticeKey).toBe('editor.duplicated');
    });

    it('does not duplicate without a signed-in user', async () => {
      mockAuth.session = undefined;
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.requestAction('duplicate'));
      await act(async () => result.current.confirmAction());
      expect(mockForms.duplicate).not.toHaveBeenCalled();
    });

    it('explains that a form without questions cannot be published', async () => {
      mockStore.publish.mockRejectedValue(new ServiceError('invalidInput'));
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.requestAction('publish'));

      await act(async () => result.current.confirmAction());

      expect(result.current.actionErrorKey).toBe('editor.publishNeedsQuestion');
    });

    it('shows other errors as they are', async () => {
      mockStore.archive.mockRejectedValue(new ServiceError('network'));
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.requestAction('archive'));

      await act(async () => result.current.confirmAction());

      expect(result.current.actionErrorKey).toBe('errors.network');
    });

    it('can be cancelled, and ignores confirming without a request', async () => {
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.requestAction('publish'));
      act(() => result.current.cancelAction());
      await act(async () => result.current.confirmAction());
      expect(mockStore.publish).not.toHaveBeenCalled();
    });

    it('ignores confirming when no form is loaded', async () => {
      mockStore.detail = undefined;
      const { result } = renderHook(() => useFormEditor('f1'));
      act(() => result.current.requestAction('publish'));
      await act(async () => result.current.confirmAction());
      expect(mockStore.publish).not.toHaveBeenCalled();
    });
  });
});
