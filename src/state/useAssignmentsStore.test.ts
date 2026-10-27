import { listMyAssignments } from '@/services/assignmentService';
import { ServiceError } from '@/services/errors';
import { makeForm } from '@/testUtils/factories';
import type { MyAssignment } from '@/types/models';
import { resetAllStores } from './storeRegistry';
import { useAssignmentsStore } from './useAssignmentsStore';

jest.mock('@/services/assignmentService', () => ({ listMyAssignments: jest.fn() }));

const item: MyAssignment = {
  assignment: { id: 'a1', formId: 'f1', userId: 'me', assignedBy: 'admin', assignedAt: new Date(0) },
  form: makeForm(),
};

beforeEach(() => {
  jest.resetAllMocks();
  useAssignmentsStore.getState().resetAll();
});

describe('useAssignmentsStore', () => {
  it('loads the assignments of a user', async () => {
    jest.mocked(listMyAssignments).mockResolvedValue([item]);

    const promise = useAssignmentsStore.getState().load('me');
    expect(useAssignmentsStore.getState().isLoading).toBe(true);
    await promise;

    expect(listMyAssignments).toHaveBeenCalledWith('me');
    expect(useAssignmentsStore.getState()).toMatchObject({ assignments: [item], isLoaded: true, isLoading: false });
  });

  it('keeps the error key when loading fails and clears it on retry', async () => {
    jest.mocked(listMyAssignments).mockRejectedValueOnce(new ServiceError('network')).mockResolvedValueOnce([]);

    await useAssignmentsStore.getState().load('me');
    expect(useAssignmentsStore.getState()).toMatchObject({ isLoaded: false, errorKey: 'errors.network' });

    await useAssignmentsStore.getState().load('me');
    expect(useAssignmentsStore.getState()).toMatchObject({ isLoaded: true, errorKey: undefined });
  });

  it('is cleared with all stores', async () => {
    jest.mocked(listMyAssignments).mockResolvedValue([item]);
    await useAssignmentsStore.getState().load('me');

    resetAllStores();

    expect(useAssignmentsStore.getState()).toMatchObject({ assignments: [], isLoaded: false });
  });
});
