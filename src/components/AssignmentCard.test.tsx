import { fireEvent, render, screen } from '@testing-library/react-native';
import i18n from '@/i18n';
import { testIdFor } from '@/constants/testIds';
import { makeForm } from '@/testUtils/factories';
import type { MyAssignment } from '@/types/models';
import { AssignmentCard } from './AssignmentCard';
import { AssignmentList } from './AssignmentList';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));

const now = new Date(2026, 10, 1);

function item(id: string, overrides: { dueAt?: Date; status?: 'draft' | 'submitted'; title?: string; description?: string } = {}): MyAssignment {
  return {
    assignment: { id, formId: `f-${id}`, userId: 'me', assignedBy: 'admin', dueAt: overrides.dueAt, assignedAt: new Date(0) },
    form: makeForm({ id: `f-${id}`, title: overrides.title ?? 'Feedback', description: overrides.description }),
    submission:
      overrides.status === undefined
        ? undefined
        : { id: `s-${id}`, assignmentId: id, status: overrides.status, createdAt: new Date(0), updatedAt: new Date(0) },
  };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('AssignmentCard', () => {
  it('shows title, description, status and due date', () => {
    render(<AssignmentCard item={item('a1', { dueAt: new Date(2026, 11, 24), description: 'Please answer' })} onPress={jest.fn()} now={now} />);
    expect(screen.getByText('Feedback')).toBeTruthy();
    expect(screen.getByText('Please answer')).toBeTruthy();
    expect(screen.getByText('Not started')).toBeTruthy();
    expect(screen.getByText('Due on Dec 24, 2026')).toBeTruthy();
  });

  it.each([
    ['draft', 'In progress'],
    ['submitted', 'Submitted'],
  ] as const)('labels a %s response', (status, label) => {
    render(<AssignmentCard item={item('a1', { status })} onPress={jest.fn()} now={now} />);
    expect(screen.getByText(label)).toBeTruthy();
  });

  it('flags an overdue assignment', () => {
    render(<AssignmentCard item={item('a1', { dueAt: new Date(2026, 9, 1) })} onPress={jest.fn()} now={now} />);
    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('says when there is no due date', () => {
    render(<AssignmentCard item={item('a1')} onPress={jest.fn()} now={now} />);
    expect(screen.getByText('No due date')).toBeTruthy();
  });

  it('falls back to a placeholder title and hides an empty description', () => {
    render(<AssignmentCard item={item('a1', { title: ' ', description: '' })} onPress={jest.fn()} now={now} />);
    expect(screen.getByText('Untitled')).toBeTruthy();
  });

  it('opens the assignment', () => {
    const onPress = jest.fn();
    const entry = item('a1');
    render(<AssignmentCard item={entry} onPress={onPress} now={now} />);
    fireEvent.press(screen.getByTestId(testIdFor.assignmentCard('a1')));
    expect(onPress).toHaveBeenCalledWith(entry);
  });

  it('uses the current time by default', () => {
    render(<AssignmentCard item={item('a1', { dueAt: new Date(2000, 0, 1) })} onPress={jest.fn()} />);
    expect(screen.getByText('Overdue')).toBeTruthy();
  });
});

describe('AssignmentList', () => {
  it('renders a card per assignment and reports presses', () => {
    const onPressItem = jest.fn();
    const second = item('a2', { title: 'Survey' });
    render(<AssignmentList items={[item('a1'), second]} onPressItem={onPressItem} />);
    fireEvent.press(screen.getByTestId(testIdFor.assignmentCard('a2')));
    expect(onPressItem).toHaveBeenCalledWith(second);
    expect(screen.getByTestId(testIdFor.assignmentCard('a1'))).toBeTruthy();
  });

  it('supports pull to refresh', () => {
    const onRefresh = jest.fn();
    render(<AssignmentList items={[item('a1')]} onPressItem={jest.fn()} onRefresh={onRefresh} isRefreshing testID="list" />);
    const list = screen.getByTestId('list');
    expect(list.props.refreshControl.props.refreshing).toBe(true);
    list.props.refreshControl.props.onRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
