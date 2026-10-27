import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor, testIds } from '@/constants/testIds';
import type { FormAssignee, Profile } from '@/types/models';
import { AssignUserList } from './AssignUserList';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const ids = testIds.assign;

function user(id: string, fullName: string): Profile {
  return { id, fullName, email: `${id}@b.c`, role: 'user', mustChangePassword: false, createdAt: new Date(0), updatedAt: new Date(0) };
}

function assignee(assignmentId: string, person: Profile, dueAt?: Date): FormAssignee {
  return {
    assignment: { id: assignmentId, formId: 'f1', userId: person.id, assignedBy: 'admin', dueAt, assignedAt: new Date(0) },
    user: person,
  };
}

function setup(props: Partial<React.ComponentProps<typeof AssignUserList>> = {}) {
  const handlers = {
    onToggle: jest.fn(),
    onQueryChange: jest.fn(),
    onDueDateChange: jest.fn(),
    onSubmit: jest.fn(),
    onUnassign: jest.fn(),
  };
  render(
    <AssignUserList
      assignees={[]}
      candidates={[user('c1', 'Carl'), user('c2', 'Dana')]}
      totalCandidates={2}
      selectedIds={[]}
      query=""
      dueDateText=""
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('AssignUserList: people who have the form', () => {
  it('says so when nobody has it', () => {
    setup();
    expect(screen.getByTestId(ids.noneAssigned)).toBeTruthy();
    expect(screen.queryByTestId(ids.assigneeList)).toBeNull();
  });

  it('lists assignees with their due date', () => {
    const ann = assignee('a1', user('u1', 'Ann'), new Date(2026, 10, 4));
    const bob = assignee('a2', user('u2', 'Bob'));
    setup({ assignees: [ann, bob] });
    expect(screen.getByTestId(testIdFor.assignee('a1'))).toHaveTextContent(/Ann/);
    expect(screen.getByText('Due on Nov 4, 2026')).toBeTruthy();
    expect(screen.getByText('No due date')).toBeTruthy();
  });

  it('shows the email when a name is missing', () => {
    setup({ assignees: [assignee('a1', user('u1', ''))] });
    expect(screen.getByTestId(testIdFor.assignee('a1'))).toHaveTextContent(/u1@b.c/);
  });

  it('asks to unassign someone', () => {
    const ann = assignee('a1', user('u1', 'Ann'));
    const { onUnassign } = setup({ assignees: [ann] });
    fireEvent.press(screen.getByTestId(testIdFor.unassignButton('a1')));
    expect(onUnassign).toHaveBeenCalledWith(ann);
  });
});

describe('AssignUserList: adding people', () => {
  it('lists candidates and toggles them', () => {
    const { onToggle } = setup({ selectedIds: ['c2'] });
    expect(screen.getByTestId(testIdFor.assignCandidate('c1')).props.accessibilityState).toMatchObject({ checked: false });
    expect(screen.getByTestId(testIdFor.assignCandidate('c2')).props.accessibilityState).toMatchObject({ checked: true });
    fireEvent.press(screen.getByTestId(testIdFor.assignCandidate('c1')));
    expect(onToggle).toHaveBeenCalledWith('c1');
  });

  it('shows name and email, or the email alone', () => {
    setup({ candidates: [user('c1', 'Carl'), user('c2', '')] });
    expect(screen.getByLabelText('Carl (c1@b.c)')).toBeTruthy();
    expect(screen.getByLabelText('c2@b.c')).toBeTruthy();
  });

  it('searches', () => {
    const { onQueryChange } = setup();
    fireEvent.changeText(screen.getByTestId(ids.searchInput), 'car');
    expect(onQueryChange).toHaveBeenCalledWith('car');
  });

  it('tells "everyone is assigned" from "nobody matches"', () => {
    setup({ candidates: [], totalCandidates: 0 });
    expect(screen.getByTestId(ids.noCandidates)).toHaveTextContent('Everyone is already assigned.');
  });

  it('says nobody matches the search', () => {
    setup({ candidates: [], totalCandidates: 3, query: 'zzz' });
    expect(screen.getByTestId(ids.noCandidates)).toHaveTextContent('Nobody matches your search.');
  });

  it('shows no empty message while there are candidates', () => {
    setup();
    expect(screen.queryByTestId(ids.noCandidates)).toBeNull();
  });
});

describe('AssignUserList: submitting', () => {
  it('cannot submit without a selection', () => {
    const { onSubmit } = setup();
    expect(screen.getByText('Select people to assign')).toBeTruthy();
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the selection', () => {
    const { onSubmit } = setup({ selectedIds: ['c1', 'c2'] });
    expect(screen.getByText('Assign 2 selected')).toBeTruthy();
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('takes an optional due date', () => {
    const { onDueDateChange } = setup({ selectedIds: ['c1'] });
    fireEvent.changeText(screen.getByTestId(ids.dueDateInput), '2026-11-04');
    expect(onDueDateChange).toHaveBeenCalledWith('2026-11-04');
  });

  it('blocks an invalid due date and explains it', () => {
    const { onSubmit } = setup({ selectedIds: ['c1'], dueDateText: 'nope', dueDateInvalid: true });
    expect(screen.getByTestId(`${ids.dueDateInput}-error`)).toBeTruthy();
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks submitting while it is running', () => {
    const { onSubmit } = setup({ selectedIds: ['c1'], isSubmitting: true });
    fireEvent.press(screen.getByTestId(ids.submitButton));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
