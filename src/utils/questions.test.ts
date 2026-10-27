import { QUESTION_TYPES } from '@/types/enums';
import type { Form, FormDetail, Question } from '@/types/models';
import { createDefaultQuestion, questionsOfSection, sortedSections, toQuestionDraft } from './questions';

let counter = 0;
const options = (questionType: (typeof QUESTION_TYPES)[number]) => ({
  questionType,
  formId: 'f1',
  sectionId: 's1',
  orderIndex: 3,
  title: 'Untitled',
  newId: () => `id-${(counter += 1)}`,
  optionLabel: (position: number) => `Option ${position}`,
});

describe('createDefaultQuestion', () => {
  it.each(QUESTION_TYPES)('creates a valid %s question', (type) => {
    const draft = createDefaultQuestion(options(type));
    expect(draft).toMatchObject({
      questionType: type,
      formId: 'f1',
      sectionId: 's1',
      orderIndex: 3,
      title: 'Untitled',
      isRequired: false,
      isActive: true,
    });
  });

  it.each(['multiple_choice', 'checkboxes', 'dropdown'] as const)('starts %s with two labelled options', (type) => {
    const draft = createDefaultQuestion(options(type));
    if (draft.questionType !== type) throw new Error('wrong type');
    expect(draft.options.map((option) => option.label)).toEqual(['Option 1', 'Option 2']);
    expect(new Set(draft.options.map((option) => option.id)).size).toBe(2);
  });

  it('starts a linear scale from 1 to 5', () => {
    expect(createDefaultQuestion(options('linear_scale'))).toMatchObject({ settings: { min: 1, max: 5 } });
  });

  it('starts a rating with five stars', () => {
    expect(createDefaultQuestion(options('rating'))).toMatchObject({ settings: { max: 5, icon: 'star' } });
  });

  it.each(['multiple_choice_grid', 'checkbox_grid'] as const)('starts %s with a row and two columns', (type) => {
    const draft = createDefaultQuestion(options(type));
    if (draft.questionType !== type) throw new Error('wrong type');
    expect(draft.options.rows).toHaveLength(1);
    expect(draft.options.columns).toHaveLength(2);
  });

  it('asks for the year in dates and limits uploads', () => {
    expect(createDefaultQuestion(options('date'))).toMatchObject({ settings: { includeYear: true } });
    expect(createDefaultQuestion(options('file_upload'))).toMatchObject({
      settings: { maxFiles: 1, maxFileSizeMb: 10 },
    });
  });
});

describe('toQuestionDraft', () => {
  it('drops the id only', () => {
    const question: Question = {
      id: 'q1',
      formId: 'f1',
      sectionId: 's1',
      title: 'T',
      isRequired: true,
      orderIndex: 0,
      isActive: true,
      questionType: 'short_answer',
      settings: {},
    };
    const draft = toQuestionDraft(question);
    expect('id' in draft).toBe(false);
    expect(draft).toMatchObject({ title: 'T', isRequired: true });
  });
});

describe('detail selectors', () => {
  const question = (id: string, sectionId: string, orderIndex: number): Question => ({
    id,
    formId: 'f1',
    sectionId,
    title: id,
    isRequired: false,
    orderIndex,
    isActive: true,
    questionType: 'short_answer',
    settings: {},
  });
  const form: Form = {
    id: 'f1',
    title: 'Form',
    status: 'draft',
    isAcceptingResponses: true,
    limitOneResponse: true,
    allowEditAfterSubmit: false,
    shuffleQuestionOrder: false,
    showProgressBar: true,
    createdBy: 'u1',
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
  const detail: FormDetail = {
    form,
    sections: [
      { id: 's2', formId: 'f1', orderIndex: 1, afterAction: 'next' },
      { id: 's1', formId: 'f1', orderIndex: 0, afterAction: 'next' },
    ],
    questions: [question('b', 's1', 1), question('a', 's1', 0), question('c', 's2', 0)],
  };

  it('sorts sections by position without touching the original', () => {
    expect(sortedSections(detail).map((section) => section.id)).toEqual(['s1', 's2']);
    expect(detail.sections[0].id).toBe('s2');
  });

  it('returns the questions of one section sorted by position', () => {
    expect(questionsOfSection(detail, 's1').map((q) => q.id)).toEqual(['a', 'b']);
    expect(questionsOfSection(detail, 's2').map((q) => q.id)).toEqual(['c']);
    expect(questionsOfSection(detail, 'none')).toEqual([]);
  });
});
