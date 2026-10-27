import { ServiceError } from '@/services/errors';
import { archiveForm, createForm, deleteForm, duplicateForm, listForms } from '@/services/formService';
import type { Form } from '@/types/models';
import { resetAllStores } from './storeRegistry';
import { useFormsStore } from './useFormsStore';

jest.mock('@/services/formService', () => ({
  archiveForm: jest.fn(),
  createForm: jest.fn(),
  deleteForm: jest.fn(),
  duplicateForm: jest.fn(),
  listForms: jest.fn(),
}));

function form(id: string, overrides: Partial<Form> = {}): Form {
  return {
    id,
    title: id,
    status: 'draft',
    isAcceptingResponses: true,
    limitOneResponse: true,
    allowEditAfterSubmit: false,
    shuffleQuestionOrder: false,
    showProgressBar: true,
    createdBy: 'u1',
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  useFormsStore.getState().resetAll();
});

describe('load', () => {
  it('stores the forms', async () => {
    jest.mocked(listForms).mockResolvedValue([form('a'), form('b')]);

    const promise = useFormsStore.getState().load();
    expect(useFormsStore.getState().isLoading).toBe(true);
    await promise;

    expect(useFormsStore.getState()).toMatchObject({ isLoaded: true, isLoading: false, errorKey: undefined });
    expect(useFormsStore.getState().forms.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('keeps the error key when loading fails and clears it on retry', async () => {
    jest.mocked(listForms).mockRejectedValueOnce(new ServiceError('network')).mockResolvedValueOnce([]);

    await useFormsStore.getState().load();
    expect(useFormsStore.getState()).toMatchObject({ isLoaded: false, errorKey: 'errors.network' });

    await useFormsStore.getState().load();
    expect(useFormsStore.getState()).toMatchObject({ isLoaded: true, errorKey: undefined });
  });
});

describe('create', () => {
  it('adds the new form at the top', async () => {
    useFormsStore.setState({ forms: [form('a')] });
    jest.mocked(createForm).mockResolvedValue(form('new'));

    const created = await useFormsStore.getState().create({ title: 'New' }, 'u1');

    expect(createForm).toHaveBeenCalledWith({ title: 'New' }, 'u1');
    expect(created.id).toBe('new');
    expect(useFormsStore.getState().forms.map((item) => item.id)).toEqual(['new', 'a']);
  });

  it('rethrows service errors and leaves the list alone', async () => {
    useFormsStore.setState({ forms: [form('a')] });
    jest.mocked(createForm).mockRejectedValue(new ServiceError('forbidden'));

    await expect(useFormsStore.getState().create({ title: 'New' }, 'u1')).rejects.toMatchObject({ code: 'forbidden' });

    expect(useFormsStore.getState().forms).toHaveLength(1);
  });
});

describe('archive', () => {
  it('replaces the form with the archived one', async () => {
    useFormsStore.setState({ forms: [form('a'), form('b')] });
    jest.mocked(archiveForm).mockResolvedValue(form('b', { status: 'archived' }));

    await useFormsStore.getState().archive('b');

    expect(useFormsStore.getState().forms.map((item) => item.status)).toEqual(['draft', 'archived']);
  });
});

describe('duplicate', () => {
  it('adds the copy at the top', async () => {
    useFormsStore.setState({ forms: [form('a')] });
    jest.mocked(duplicateForm).mockResolvedValue(form('copy'));

    const copy = await useFormsStore.getState().duplicate('a', 'Copy of a', 'u1');

    expect(duplicateForm).toHaveBeenCalledWith('a', 'Copy of a', 'u1');
    expect(copy.id).toBe('copy');
    expect(useFormsStore.getState().forms.map((item) => item.id)).toEqual(['copy', 'a']);
  });
});

describe('remove', () => {
  it('removes the form from the list', async () => {
    useFormsStore.setState({ forms: [form('a'), form('b')] });
    jest.mocked(deleteForm).mockResolvedValue(undefined);

    await useFormsStore.getState().remove('a');

    expect(useFormsStore.getState().forms.map((item) => item.id)).toEqual(['b']);
  });

  it('keeps the form when it has answers', async () => {
    useFormsStore.setState({ forms: [form('a')] });
    jest.mocked(deleteForm).mockRejectedValue(new ServiceError('inUse'));

    await expect(useFormsStore.getState().remove('a')).rejects.toMatchObject({ code: 'inUse' });

    expect(useFormsStore.getState().forms).toHaveLength(1);
  });
});

describe('logout', () => {
  it('is cleared with all stores', () => {
    useFormsStore.setState({ forms: [form('a')], isLoaded: true });

    resetAllStores();

    expect(useFormsStore.getState()).toMatchObject({ forms: [], isLoaded: false });
  });
});
