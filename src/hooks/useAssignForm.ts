import { useEffect, useState } from 'react';
import { assignUsers, listFormAssignees, unassign } from '@/services/assignmentService';
import { toServiceError } from '@/services/errors';
import { useAuthStore } from '@/state/useAuthStore';
import { useUsersStore } from '@/state/useUsersStore';
import type { FormAssignee, Profile } from '@/types/models';
import { parseDateTimeInput } from '@/utils/dateInput';
import { filterUsers } from '@/utils/userSearch';

interface UseAssignForm {
  assignees: FormAssignee[];
  /** People that can still be added and match the search. */
  candidates: Profile[];
  totalCandidates: number;
  isLoaded: boolean;
  errorKey?: string;
  reload: () => void;
  selectedIds: string[];
  toggle: (userId: string) => void;
  query: string;
  setQuery: (query: string) => void;
  dueDateText: string;
  setDueDateText: (text: string) => void;
  dueDateInvalid: boolean;
  submit: () => Promise<void>;
  isSubmitting: boolean;
  /** The assignee waiting for the admin to confirm removing them. */
  unassignTarget?: FormAssignee;
  requestUnassign: (assignee: FormAssignee) => void;
  cancelUnassign: () => void;
  confirmUnassign: () => Promise<void>;
  /** i18n key of the last failed action. */
  actionErrorKey?: string;
  /** True right after people were assigned. */
  justAssigned: boolean;
}

/** Glue for the assign screen. The assignees belong to this screen only, so they stay local state. */
export function useAssignForm(formId: string): UseAssignForm {
  const allUsers = useUsersStore((state) => state.users);
  const loadUsers = useUsersStore((state) => state.load);
  const adminId = useAuthStore((state) => state.session?.userId);

  const [assignees, setAssignees] = useState<FormAssignee[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorKey, setErrorKey] = useState<string | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [dueDateText, setDueDateText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<FormAssignee | undefined>(undefined);
  const [actionErrorKey, setActionErrorKey] = useState<string | undefined>(undefined);
  const [justAssigned, setJustAssigned] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setErrorKey(undefined);
    void loadUsers();
    listFormAssignees(formId)
      .then((list) => {
        if (!cancelled) {
          setAssignees(list);
          setIsLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setErrorKey(toServiceError(error).messageKey);
      });
    return () => {
      cancelled = true;
    };
  }, [formId, loadUsers, reloadCount]);

  const assignedIds = new Set(assignees.map((assignee) => assignee.user.id));
  // Only people with the "user" role fill in forms; admins manage them.
  const available = allUsers.filter((user) => user.role === 'user' && !assignedIds.has(user.id));
  const dueDate = parseDateTimeInput(dueDateText);
  const dueDateInvalid = dueDate.status === 'invalid';

  async function refresh(): Promise<void> {
    setAssignees(await listFormAssignees(formId));
  }

  async function submit(): Promise<void> {
    if (adminId === undefined || selectedIds.length === 0 || dueDate.status === 'invalid') return;
    setActionErrorKey(undefined);
    setJustAssigned(false);
    setIsSubmitting(true);
    try {
      await assignUsers(formId, selectedIds, adminId, dueDate.status === 'ok' ? dueDate.date : undefined);
      await refresh();
      setSelectedIds([]);
      setJustAssigned(true);
    } catch (error) {
      setActionErrorKey(toServiceError(error).messageKey);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmUnassign(): Promise<void> {
    const target = unassignTarget;
    setUnassignTarget(undefined);
    if (target === undefined) return;
    setActionErrorKey(undefined);
    setJustAssigned(false);
    try {
      await unassign(target.assignment.id);
      await refresh();
    } catch (error) {
      setActionErrorKey(toServiceError(error).messageKey);
    }
  }

  return {
    assignees,
    candidates: filterUsers(available, query),
    totalCandidates: available.length,
    isLoaded,
    errorKey,
    reload: () => setReloadCount((count) => count + 1),
    selectedIds,
    toggle: (userId) =>
      setSelectedIds((current) => (current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId])),
    query,
    setQuery,
    dueDateText,
    setDueDateText,
    dueDateInvalid,
    submit,
    isSubmitting,
    unassignTarget,
    requestUnassign: setUnassignTarget,
    cancelUnassign: () => setUnassignTarget(undefined),
    confirmUnassign,
    actionErrorKey,
    justAssigned,
  };
}
