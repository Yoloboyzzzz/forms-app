import { CORE_QUESTION_TYPES, QUESTION_TYPES, type QuestionType } from '@/types/enums';
import type { Question } from '@/types/models';
import { assertNever } from '@/utils/assertNever';

/** Fails to compile when a QuestionType has no model in the Question union. */
function describeType(question: Question): QuestionType {
  switch (question.questionType) {
    case 'short_answer':
    case 'paragraph':
    case 'multiple_choice':
    case 'checkboxes':
    case 'dropdown':
    case 'linear_scale':
    case 'rating':
    case 'multiple_choice_grid':
    case 'checkbox_grid':
    case 'date':
    case 'time':
    case 'file_upload':
      return question.questionType;
    default:
      return assertNever(question);
  }
}

describe('types', () => {
  it('lists every question type once', () => {
    expect(new Set(QUESTION_TYPES).size).toBe(12);
  });

  it('keeps core types a subset of all types', () => {
    CORE_QUESTION_TYPES.forEach((type) => expect(QUESTION_TYPES).toContain(type));
  });

  it('narrows questions by questionType', () => {
    const question: Question = {
      id: 'q1',
      formId: 'f1',
      sectionId: 's1',
      title: 'Pick',
      isRequired: false,
      orderIndex: 0,
      isActive: true,
      questionType: 'dropdown',
      options: [{ id: 'o1', label: 'A' }],
      settings: {},
    };
    expect(describeType(question)).toBe('dropdown');
  });
});

describe('assertNever', () => {
  it('throws when reached', () => {
    // Deliberately bypasses the compile-time guard to exercise the runtime branch.
    expect(() => assertNever('x' as never)).toThrow('Unexpected value');
  });
});
