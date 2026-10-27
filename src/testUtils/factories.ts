import type { Form, FormDetail, FormSection, Question, QuestionDraft } from '@/types/models';

/** Test data builders. Not part of the app: excluded from coverage. */

export function makeForm(overrides: Partial<Form> = {}): Form {
  return {
    id: 'f1',
    title: 'Customer feedback',
    status: 'draft',
    isAcceptingResponses: true,
    limitOneResponse: true,
    allowEditAfterSubmit: false,
    shuffleQuestionOrder: false,
    showProgressBar: true,
    createdBy: 'u1',
    createdAt: new Date(2026, 9, 1),
    updatedAt: new Date(2026, 9, 27),
    ...overrides,
  };
}

export function makeSection(id = 's1', orderIndex = 0, overrides: Partial<FormSection> = {}): FormSection {
  return { id, formId: 'f1', orderIndex, afterAction: 'next', ...overrides };
}

export function makeQuestion(id = 'q1', overrides: Partial<QuestionDraft> = {}): Question {
  return {
    id,
    formId: 'f1',
    sectionId: 's1',
    title: `Question ${id}`,
    isRequired: false,
    orderIndex: 0,
    isActive: true,
    questionType: 'short_answer',
    settings: {},
    ...overrides,
  } as Question; // overrides may switch questionType together with matching options/settings
}

export function makeDetail(overrides: Partial<FormDetail> = {}): FormDetail {
  return {
    form: makeForm(),
    sections: [makeSection('s1', 0), makeSection('s2', 1)],
    questions: [makeQuestion('a'), makeQuestion('b', { orderIndex: 1 }), makeQuestion('c', { sectionId: 's2' })],
    ...overrides,
  };
}
