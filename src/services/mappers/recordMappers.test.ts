import type { AssignmentRow, FormRow, ProfileRow, SectionRow, SubmissionRow } from '@/types/database';
import {
  toAssignment,
  toAssignmentInsert,
  toForm,
  toFormCopyInsert,
  toFormInsert,
  toFormUpdate,
  toProfile,
  toSection,
  toSectionInsert,
  toSectionUpdate,
  toSubmission,
} from './recordMappers';

const TS = '2026-10-27T10:00:00Z';

const profileRow: ProfileRow = {
  id: 'u1',
  email: 'a@b.c',
  full_name: 'Ann',
  role: 'admin',
  must_change_password: false,
  created_at: TS,
  updated_at: TS,
};

const formRow: FormRow = {
  id: 'f1',
  title: 'Form',
  description: null,
  status: 'draft',
  is_accepting_responses: true,
  closes_at: null,
  limit_one_response: true,
  allow_edit_after_submit: false,
  shuffle_question_order: false,
  show_progress_bar: true,
  confirmation_message: null,
  created_by: 'u1',
  published_at: null,
  created_at: TS,
  updated_at: TS,
};

const sectionRow: SectionRow = {
  id: 's1',
  form_id: 'f1',
  title: null,
  description: null,
  order_index: 1,
  after_action: 'next',
  go_to_section_id: null,
  created_at: TS,
  updated_at: TS,
};

describe('toProfile', () => {
  it('maps columns to camelCase with dates', () => {
    expect(toProfile(profileRow)).toEqual({
      id: 'u1',
      email: 'a@b.c',
      fullName: 'Ann',
      role: 'admin',
      mustChangePassword: false,
      createdAt: new Date(TS),
      updatedAt: new Date(TS),
    });
  });
});

describe('forms', () => {
  it('maps a form and converts nulls to undefined', () => {
    const form = toForm(formRow);
    expect(form).toMatchObject({ id: 'f1', title: 'Form', status: 'draft', limitOneResponse: true, createdBy: 'u1' });
    expect(form.description).toBeUndefined();
    expect(form.closesAt).toBeUndefined();
    expect(form.publishedAt).toBeUndefined();
    expect(form.confirmationMessage).toBeUndefined();
  });

  it('maps optional values when present', () => {
    const form = toForm({ ...formRow, description: 'd', closes_at: TS, published_at: TS, confirmation_message: 'ok' });
    expect(form).toMatchObject({ description: 'd', confirmationMessage: 'ok' });
    expect(form.closesAt).toEqual(new Date(TS));
    expect(form.publishedAt).toEqual(new Date(TS));
  });

  it('builds an insert payload', () => {
    expect(toFormInsert({ title: 'T' }, 'u1')).toEqual({ title: 'T', description: null, created_by: 'u1' });
    expect(toFormInsert({ title: 'T', description: 'd' }, 'u1').description).toBe('d');
  });

  it('copies settings into a draft insert for a new owner', () => {
    const source = toForm({
      ...formRow,
      description: 'd',
      closes_at: TS,
      confirmation_message: 'bye',
      limit_one_response: false,
      allow_edit_after_submit: true,
      shuffle_question_order: true,
      show_progress_bar: false,
      is_accepting_responses: false,
    });
    expect(toFormCopyInsert(source, 'Copy', 'u2')).toEqual({
      title: 'Copy',
      description: 'd',
      is_accepting_responses: false,
      closes_at: new Date(TS).toISOString(),
      limit_one_response: false,
      allow_edit_after_submit: true,
      shuffle_question_order: true,
      show_progress_bar: false,
      confirmation_message: 'bye',
      created_by: 'u2',
    });
    expect(toFormCopyInsert(toForm(formRow), 'Copy', 'u2')).toMatchObject({
      description: null,
      closes_at: null,
      confirmation_message: null,
    });
  });

  it('builds an update payload from present keys only', () => {
    expect(toFormUpdate({})).toEqual({});
    expect(
      toFormUpdate({
        title: 'New',
        description: 'd',
        isAcceptingResponses: false,
        closesAt: new Date(TS),
        limitOneResponse: false,
        allowEditAfterSubmit: true,
        shuffleQuestionOrder: true,
        showProgressBar: false,
        confirmationMessage: 'bye',
      }),
    ).toEqual({
      title: 'New',
      description: 'd',
      is_accepting_responses: false,
      closes_at: new Date(TS).toISOString(),
      limit_one_response: false,
      allow_edit_after_submit: true,
      shuffle_question_order: true,
      show_progress_bar: false,
      confirmation_message: 'bye',
    });
  });

  it('clears columns when a present key is undefined', () => {
    expect(toFormUpdate({ description: undefined, closesAt: undefined, confirmationMessage: undefined })).toEqual({
      description: null,
      closes_at: null,
      confirmation_message: null,
    });
  });

  it('ignores required keys explicitly set to undefined', () => {
    expect(toFormUpdate({ title: undefined, showProgressBar: undefined })).toEqual({});
  });
});

describe('sections', () => {
  it('maps a section', () => {
    expect(toSection(sectionRow)).toEqual({
      id: 's1',
      formId: 'f1',
      title: undefined,
      description: undefined,
      orderIndex: 1,
      afterAction: 'next',
      goToSectionId: undefined,
    });
    expect(toSection({ ...sectionRow, title: 'T', go_to_section_id: 's2' })).toMatchObject({
      title: 'T',
      goToSectionId: 's2',
    });
  });

  it('builds an insert payload', () => {
    expect(toSectionInsert({ formId: 'f1', orderIndex: 2, afterAction: 'goto', goToSectionId: 's2', title: 'T' })).toEqual({
      form_id: 'f1',
      title: 'T',
      description: null,
      order_index: 2,
      after_action: 'goto',
      go_to_section_id: 's2',
    });
    expect(toSectionInsert({ formId: 'f1', orderIndex: 0, afterAction: 'next' })).toMatchObject({
      title: null,
      go_to_section_id: null,
    });
  });

  it('builds an update payload', () => {
    expect(toSectionUpdate({})).toEqual({});
    expect(
      toSectionUpdate({ title: 'T', description: 'd', orderIndex: 3, afterAction: 'submit', goToSectionId: 's9' }),
    ).toEqual({ title: 'T', description: 'd', order_index: 3, after_action: 'submit', go_to_section_id: 's9' });
    expect(toSectionUpdate({ title: undefined, description: undefined, goToSectionId: undefined })).toEqual({
      title: null,
      description: null,
      go_to_section_id: null,
    });
    expect(toSectionUpdate({ orderIndex: undefined, afterAction: undefined })).toEqual({});
  });
});

describe('assignments', () => {
  const row: AssignmentRow = {
    id: 'a1',
    form_id: 'f1',
    user_id: 'u2',
    assigned_by: 'u1',
    due_at: null,
    assigned_at: TS,
  };

  it('maps an assignment', () => {
    expect(toAssignment(row)).toEqual({
      id: 'a1',
      formId: 'f1',
      userId: 'u2',
      assignedBy: 'u1',
      dueAt: undefined,
      assignedAt: new Date(TS),
    });
    expect(toAssignment({ ...row, due_at: TS }).dueAt).toEqual(new Date(TS));
  });

  it('builds an insert payload', () => {
    expect(toAssignmentInsert('f1', 'u2', 'u1')).toEqual({
      form_id: 'f1',
      user_id: 'u2',
      assigned_by: 'u1',
      due_at: null,
    });
    expect(toAssignmentInsert('f1', 'u2', 'u1', new Date(TS)).due_at).toBe(new Date(TS).toISOString());
  });
});

describe('toSubmission', () => {
  const row: SubmissionRow = {
    id: 'sub1',
    assignment_id: 'a1',
    status: 'draft',
    submitted_at: null,
    created_at: TS,
    updated_at: TS,
  };

  it('maps a submission', () => {
    expect(toSubmission(row)).toMatchObject({ id: 'sub1', assignmentId: 'a1', status: 'draft' });
    expect(toSubmission(row).submittedAt).toBeUndefined();
    expect(toSubmission({ ...row, status: 'submitted', submitted_at: TS }).submittedAt).toEqual(new Date(TS));
  });
});
