import { makeForm } from '@/testUtils/factories';
import type { MyAssignment, Submission } from '@/types/models';
import { getAssignmentStatus, isSubmitted } from './assignmentStatus';

const now = new Date(2026, 10, 1);

function item(dueAt?: Date, submission?: Pick<Submission, 'status'>): MyAssignment {
  return {
    assignment: { id: 'a1', formId: 'f1', userId: 'u1', assignedBy: 'admin', dueAt, assignedAt: new Date(0) },
    form: makeForm(),
    submission:
      submission === undefined
        ? undefined
        : { id: 's1', assignmentId: 'a1', createdAt: new Date(0), updatedAt: new Date(0), ...submission },
  };
}

describe('getAssignmentStatus', () => {
  it('is not started without a response', () => {
    expect(getAssignmentStatus(item(), now)).toBe('notStarted');
  });

  it('is in progress with a draft', () => {
    expect(getAssignmentStatus(item(undefined, { status: 'draft' }), now)).toBe('inProgress');
  });

  it('is submitted with a submitted response, even after the due date', () => {
    expect(getAssignmentStatus(item(undefined, { status: 'submitted' }), now)).toBe('submitted');
    expect(getAssignmentStatus(item(new Date(2026, 9, 1), { status: 'submitted' }), now)).toBe('submitted');
  });

  it('is overdue after the due date when not submitted', () => {
    expect(getAssignmentStatus(item(new Date(2026, 9, 1)), now)).toBe('overdue');
    expect(getAssignmentStatus(item(new Date(2026, 9, 1), { status: 'draft' }), now)).toBe('overdue');
  });

  it('is not overdue before or exactly at the due date', () => {
    expect(getAssignmentStatus(item(new Date(2026, 11, 1)), now)).toBe('notStarted');
    expect(getAssignmentStatus(item(now), now)).toBe('notStarted');
  });
});

describe('isSubmitted', () => {
  it('is true only for submitted responses', () => {
    expect(isSubmitted(item(undefined, { status: 'submitted' }))).toBe(true);
    expect(isSubmitted(item(undefined, { status: 'draft' }))).toBe(false);
    expect(isSubmitted(item())).toBe(false);
  });
});
