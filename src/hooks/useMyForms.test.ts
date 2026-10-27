import { act, renderHook } from '@testing-library/react-native';
import { useMyForms } from '@/hooks/useMyForms';
import { makeForm } from '@/testUtils/factories';
import type { MyAssignment } from '@/types/models';

function entry(id: string, status?: 'draft' | 'submitted'): MyAssignment {
  return {
    assignment: { id, formId: 'f1', userId: 'me', assignedBy: 'admin', assignedAt: new Date(0) },
    form: makeForm(),
    submission: status === undefined ? undefined : { id: `s-${id}`, assignmentId: id, status, createdAt: new Date(0), updatedAt: new Date(0) },
  };
}

const mockAssignments = {
  assignments: [entry('new'), entry('draft', 'draft'), entry('done', 'submitted')],
  isLoaded: true,
  isLoading: false,
  errorKey: undefined as string | undefined,
  load: jest.fn(),
};
const mockAuth: { session?: { userId: string } } = { session: { userId: 'me' } };

jest.mock('@/state/useAssignmentsStore', () => ({
  useAssignmentsStore: (selector: (state: typeof mockAssignments) => unknown) => selector(mockAssignments),
}));
jest.mock('@/state/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof mockAuth) => unknown) => selector(mockAuth),
}));

beforeEach(() => {
  mockAssignments.load = jest.fn().mockResolvedValue(undefined);
  mockAssignments.errorKey = undefined;
  mockAuth.session = { userId: 'me' };
});

describe('useMyForms', () => {
  it('loads the user assignments on mount', () => {
    renderHook(() => useMyForms());
    expect(mockAssignments.load).toHaveBeenCalledWith('me');
  });

  it('does not load without a signed-in user', () => {
    mockAuth.session = undefined;
    const { result } = renderHook(() => useMyForms());
    act(() => result.current.reload());
    expect(mockAssignments.load).not.toHaveBeenCalled();
  });

  it('starts on the to do tab: not started and in progress', () => {
    const { result } = renderHook(() => useMyForms());
    expect(result.current.tab).toBe('todo');
    expect(result.current.items.map((item) => item.assignment.id)).toEqual(['new', 'draft']);
  });

  it('switches to the submitted tab', () => {
    const { result } = renderHook(() => useMyForms());
    act(() => result.current.setTab('submitted'));
    expect(result.current.items.map((item) => item.assignment.id)).toEqual(['done']);
  });

  it('reloads on demand and exposes store state', () => {
    mockAssignments.errorKey = 'errors.network';
    const { result } = renderHook(() => useMyForms());
    act(() => result.current.reload());
    expect(mockAssignments.load).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ isLoaded: true, isLoading: false, errorKey: 'errors.network' });
  });
});
