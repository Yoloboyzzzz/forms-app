import type { MyAssignment } from '@/types/models';

export type AssignmentStatus = 'notStarted' | 'inProgress' | 'submitted' | 'overdue';

/**
 * Where the user stands with an assignment. "Overdue" wins over "not started" and "in progress"
 * once the due date has passed; a submitted response is never overdue.
 */
export function getAssignmentStatus(item: MyAssignment, now: Date): AssignmentStatus {
  if (item.submission?.status === 'submitted') {
    return 'submitted';
  }
  const { dueAt } = item.assignment;
  if (dueAt !== undefined && dueAt.getTime() < now.getTime()) {
    return 'overdue';
  }
  return item.submission === undefined ? 'notStarted' : 'inProgress';
}

/** Submitted responses go to the "submitted" tab; everything else is still to do. */
export function isSubmitted(item: MyAssignment): boolean {
  return item.submission?.status === 'submitted';
}
