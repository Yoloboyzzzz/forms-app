import { QUESTION_TYPES } from '@/types/enums';
import type { QuestionRow } from '@/types/database';
import type { QuestionDraft } from '@/types/models';
import { toQuestion, toQuestionPayload } from './questionMapper';

function row(overrides: Partial<QuestionRow>): QuestionRow {
  return {
    id: 'q1',
    form_id: 'f1',
    section_id: 's1',
    title: 'Title',
    description: null,
    question_type: 'short_answer',
    is_required: false,
    options: null,
    settings: {},
    image_path: null,
    order_index: 0,
    is_active: true,
    created_at: '2026-10-27T10:00:00Z',
    updated_at: '2026-10-27T10:00:00Z',
    ...overrides,
  };
}

const choiceOptions = [
  { id: 'a', label: 'A', goTo: null },
  { id: 'b', label: 'B', goTo: 'submit' },
];
const gridOptions = { rows: [{ id: 'r', label: 'R' }], columns: [{ id: 'c', label: 'C' }] };

describe('toQuestion', () => {
  it('maps base columns and converts nulls', () => {
    const question = toQuestion(row({ description: 'd', image_path: 'p.png', is_required: true, order_index: 3 }));
    expect(question).toMatchObject({
      id: 'q1',
      formId: 'f1',
      sectionId: 's1',
      title: 'Title',
      description: 'd',
      imagePath: 'p.png',
      isRequired: true,
      orderIndex: 3,
      isActive: true,
      questionType: 'short_answer',
    });
    expect(toQuestion(row({})).description).toBeUndefined();
  });

  it.each(QUESTION_TYPES)('maps type %s', (type) => {
    const isGrid = type === 'multiple_choice_grid' || type === 'checkbox_grid';
    const isChoice = type === 'multiple_choice' || type === 'checkboxes' || type === 'dropdown';
    const question = toQuestion(
      row({ question_type: type, options: isGrid ? gridOptions : isChoice ? choiceOptions : null }),
    );
    expect(question.questionType).toBe(type);
  });

  it('parses options and settings', () => {
    const question = toQuestion(
      row({ question_type: 'multiple_choice', options: choiceOptions, settings: { hasOtherOption: true } }),
    );
    if (question.questionType !== 'multiple_choice') throw new Error('wrong type');
    expect(question.options).toHaveLength(2);
    expect(question.options[1].goTo).toBe('submit');
    expect(question.settings.hasOtherOption).toBe(true);
  });

  it('falls back to empty settings and options for invalid jsonb', () => {
    const question = toQuestion(row({ question_type: 'checkboxes', options: 'garbage', settings: [1, 2] }));
    if (question.questionType !== 'checkboxes') throw new Error('wrong type');
    expect(question.options).toEqual([]);
    expect(question.settings.hasOtherOption).toBeUndefined();
  });
});

describe('toQuestionPayload', () => {
  const base = { formId: 'f1', sectionId: 's1', title: 'T', isRequired: true, orderIndex: 2, isActive: true };

  it('serialises choice options with null goTo', () => {
    const draft: QuestionDraft = {
      ...base,
      questionType: 'dropdown',
      options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B', goTo: 's2' }],
      settings: { shuffleOptions: true },
    };
    expect(toQuestionPayload(draft)).toEqual({
      form_id: 'f1',
      section_id: 's1',
      title: 'T',
      description: null,
      question_type: 'dropdown',
      is_required: true,
      options: [
        { id: 'a', label: 'A', goTo: null },
        { id: 'b', label: 'B', goTo: 's2' },
      ],
      settings: { shuffleOptions: true },
      image_path: null,
      order_index: 2,
      is_active: true,
    });
  });

  it('serialises grid options', () => {
    const draft: QuestionDraft = { ...base, questionType: 'checkbox_grid', options: gridOptions, settings: {} };
    expect(toQuestionPayload(draft).options).toEqual(gridOptions);
  });

  it.each(['short_answer', 'paragraph', 'linear_scale', 'rating', 'date', 'time', 'file_upload'] as const)(
    'has no options for %s',
    (type) => {
      const draft: QuestionDraft = { ...base, questionType: type, settings: {} };
      expect(toQuestionPayload(draft).options).toBeNull();
    },
  );

  it('round-trips through toQuestion', () => {
    const draft: QuestionDraft = {
      ...base,
      description: 'desc',
      imagePath: 'img.png',
      questionType: 'multiple_choice',
      options: [{ id: 'a', label: 'A', goTo: 'submit' }],
      settings: { goToSectionBasedOnAnswer: true },
    };
    const payload = toQuestionPayload(draft);
    const stored = toQuestion(
      row({
        question_type: 'multiple_choice',
        title: payload.title,
        description: payload.description ?? null,
        image_path: payload.image_path ?? null,
        options: payload.options ?? null,
        settings: payload.settings ?? {},
        is_required: true,
        order_index: 2,
      }),
    );
    expect(stored).toMatchObject({ ...draft, id: 'q1' });
  });
});
