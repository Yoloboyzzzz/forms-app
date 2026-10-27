import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAssignForm } from '@/hooks/useAssignForm';
import { assignUsers, listFormAssignees, unassign } from '@/services/assignmentService';
import { ServiceError } from '@/services/errors';
import type { FormAssignee, Profile } from '@/types/models';

const mockUsers = { users: [] as Profile[], load: jest.fn() };
const mockAuth: { session?: { userId: string } } = { session: { userId: 'admin' } };

jest.mock('@/services/assignmentService', () => ({
  assignUsers: jest.fn(),
  listFormAssignees: jest.fn(),
  unassign: jest.fn(),
}));
jest.mock('@/state/useUsersStore', () => ({
  useUsersStore: (selector: (state: typeof mockUsers) => unknown) => selector(mockUsers),
}));
jest.mock('@/state/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof mockAuth) => unknown) => selector(mockAuth),
}));

function user(id: string, fullName: string, role: Profile['role'] = 'user'): Profile {
  return { id, fullName, email: `${id}@b.c`, role, mustChangePassword: false, createdAt: new Date(0), updatedAt: new Date(0) };
}

function assignee(assignmentId: string, person: Profile): FormAssignee {
  return {
    assignment: { id: assignmentId, formId: 'f1', userId: person.id, assignedBy: 'admin', assignedAt: new Date(0) },
    user: person,
  };
}

async function setup() {
  const hook = renderHook(() => useAssignForm('f1'));
  await waitFor(() => expect(hook.result.current.isLoaded).toBe(true));
  return hook;
}

beforeEach(() => {
  jest.resetAllMocks();
  mockUsers.users = [user('u1', 'Ann'), user('u2', 'Bob'), user('u3', 'Cleo'), user('boss', 'Boss', 'admin')];
  mockUsers.load = jest.fn().mockResolvedValue(undefined);
  mockAuth.session = { userId: 'admin' };
  jest.mocked(listFormAssignees).mockResolvedValue([assignee('a1', mockUsers.users[0])]);
  jest.mocked(assignUsers).mockResolvedValue(undefined);
  jest.mocked(unassign).mockResolvedValue(undefined);
});

describe('loading', () => {
  it('loads users and assignees for the form', async () => {
    const { result } = await setup();
    expect(mockUsers.load).toHaveBeenCalled();
    expect(listFormAssignees).toHaveBeenCalledWith('f1');
    expect(result.current.assignees).toHaveLength(1);
  });

  it('offers only regular users that are not assigned yet', async () => {
    const { result } = await setup();
    expect(result.current.candidates.map((item) => item.id)).toEqual(['u2', 'u3']);
    expect(result.current.totalCandidates).toBe(2);
  });

  it('shows the error and can retry', async () => {
    jest.mocked(listFormAssignees).mockRejectedValueOnce(new ServiceError('network'));
    const { result } = renderHook(() => useAssignForm('f1'));
    await waitFor(() => expect(result.current.errorKey).toBe('errors.network'));
    expect(result.current.isLoaded).toBe(false);

    act(() => result.current.reload());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.errorKey).toBeUndefined();
  });

  it('ignores a result that arrives after leaving the screen', async () => {
    let finish: (list: FormAssignee[]) => void = () => undefined;
    jest.mocked(listFormAssignees).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { result, unmount } = renderHook(() => useAssignForm('f1'));
    unmount();
    await act(async () => finish([]));
    expect(result.current.isLoaded).toBe(false);
  });

  it('ignores an error that arrives after leaving the screen', async () => {
    let fail: (error: Error) => void = () => undefined;
    jest.mocked(listFormAssignees).mockReturnValue(new Promise((_, reject) => (fail = reject)));
    const { result, unmount } = renderHook(() => useAssignForm('f1'));
    unmount();
    await act(async () => fail(new Error('late')));
    expect(result.current.errorKey).toBeUndefined();
  });
});

describe('selecting', () => {
  it('searches among candidates', async () => {
    const { result } = await setup();
    act(() => result.current.setQuery('cle'));
    expect(result.current.candidates.map((item) => item.id)).toEqual(['u3']);
  });

  it('toggles the selection', async () => {
    const { result } = await setup();
    act(() => result.current.toggle('u2'));
    act(() => result.current.toggle('u3'));
    expect(result.current.selectedIds).toEqual(['u2', 'u3']);
    act(() => result.current.toggle('u2'));
    expect(result.current.selectedIds).toEqual(['u3']);
  });
});

describe('assigning', () => {
  it('assigns the selection with the due date, then refreshes and clears', async () => {
    const { result } = await setup();
    act(() => result.current.toggle('u2'));
    act(() => result.current.setDueDateText('2026-11-04'));

    await act(async () => result.current.submit());

    expect(assignUsers).toHaveBeenCalledWith('f1', ['u2'], 'admin', new Date(2026, 10, 4, 23, 59));
    expect(listFormAssignees).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ selectedIds: [], justAssigned: true, isSubmitting: false });
  });

  it('assigns without a due date', async () => {
    const { result } = await setup();
    act(() => result.current.toggle('u2'));
    await act(async () => result.current.submit());
    expect(assignUsers).toHaveBeenCalledWith('f1', ['u2'], 'admin', undefined);
  });

  it('refuses an invalid due date', async () => {
    const { result } = await setup();
    act(() => result.current.toggle('u2'));
    act(() => result.current.setDueDateText('nope'));
    expect(result.current.dueDateInvalid).toBe(true);

    await act(async () => result.current.submit());

    expect(assignUsers).not.toHaveBeenCalled();
  });

  it('does nothing without a selection or a signed-in admin', async () => {
    const { result } = await setup();
    await act(async () => result.current.submit());
    mockAuth.session = undefined;
    const second = await setup();
    act(() => second.result.current.toggle('u2'));
    await act(async () => second.result.current.submit());
    expect(assignUsers).not.toHaveBeenCalled();
  });

  it('keeps the selection and shows the error when it fails', async () => {
    jest.mocked(assignUsers).mockRejectedValue(new ServiceError('forbidden'));
    const { result } = await setup();
    act(() => result.current.toggle('u2'));

    await act(async () => result.current.submit());

    expect(result.current).toMatchObject({ selectedIds: ['u2'], actionErrorKey: 'errors.forbidden', justAssigned: false });
  });
});

describe('unassigning', () => {
  it('asks first, then removes and refreshes', async () => {
    const { result } = await setup();
    const target = result.current.assignees[0];
    act(() => result.current.requestUnassign(target));
    expect(result.current.unassignTarget).toBe(target);
    expect(unassign).not.toHaveBeenCalled();

    await act(async () => result.current.confirmUnassign());

    expect(unassign).toHaveBeenCalledWith('a1');
    expect(listFormAssignees).toHaveBeenCalledTimes(2);
    expect(result.current.unassignTarget).toBeUndefined();
  });

  it('can be cancelled', async () => {
    const { result } = await setup();
    act(() => result.current.requestUnassign(result.current.assignees[0]));
    act(() => result.current.cancelUnassign());
    await act(async () => result.current.confirmUnassign());
    expect(unassign).not.toHaveBeenCalled();
  });

  it('shows the error when removing fails', async () => {
    jest.mocked(unassign).mockRejectedValue(new ServiceError('forbidden'));
    const { result } = await setup();
    act(() => result.current.requestUnassign(result.current.assignees[0]));

    await act(async () => result.current.confirmUnassign());

    expect(result.current.actionErrorKey).toBe('errors.forbidden');
  });
});
