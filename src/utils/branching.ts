import { GO_TO_SUBMIT, type AnswerValue, type FormSection, type Question } from '@/types/models';

/** What comes after a section: another section, or the end of the form. */
export type NextStep = { kind: 'section'; sectionId: string } | { kind: 'submit' };

export type AnswerMap = Readonly<Record<string, AnswerValue | undefined>>;

const SUBMIT: NextStep = { kind: 'submit' };

function sortSections(sections: readonly FormSection[]): FormSection[] {
  return [...sections].sort((a, b) => a.orderIndex - b.orderIndex);
}

function chosenOptionId(value: AnswerValue | undefined): string | undefined {
  if (typeof value === 'object' && !Array.isArray(value) && 'optionId' in value && typeof value.optionId === 'string') {
    return value.optionId;
  }
  return undefined;
}

/** The jump set on the option the respondent picked, in the first question of the section that has one. */
function answerBasedJump(section: FormSection, questions: readonly Question[], answers: AnswerMap): string | undefined {
  const candidates = questions
    .filter((question) => question.sectionId === section.id && question.isActive)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  for (const question of candidates) {
    if (
      (question.questionType === 'multiple_choice' || question.questionType === 'dropdown') &&
      question.settings.goToSectionBasedOnAnswer === true
    ) {
      const optionId = chosenOptionId(answers[question.id]);
      const goTo = question.options.find((option) => option.id === optionId)?.goTo;
      if (goTo !== undefined) {
        return goTo;
      }
    }
  }
  return undefined;
}

/**
 * Which step follows `sectionId`, given the answers so far. Mirrors the SQL function
 * `submission_section_path`: an answer-based jump wins over the section's own "after this section"
 * setting; a jump to a section that no longer exists is ignored.
 */
export function getNextSection(
  sections: readonly FormSection[],
  questions: readonly Question[],
  answers: AnswerMap,
  sectionId: string,
): NextStep {
  const ordered = sortSections(sections);
  const index = ordered.findIndex((section) => section.id === sectionId);
  const section = ordered[index];
  if (section === undefined) {
    return SUBMIT;
  }

  const jump = answerBasedJump(section, questions, answers);
  if (jump === GO_TO_SUBMIT) {
    return SUBMIT;
  }
  if (jump !== undefined && ordered.some((candidate) => candidate.id === jump)) {
    return { kind: 'section', sectionId: jump };
  }

  if (section.afterAction === 'submit') {
    return SUBMIT;
  }
  if (section.afterAction === 'goto' && section.goToSectionId !== undefined) {
    return { kind: 'section', sectionId: section.goToSectionId };
  }
  const next = ordered[index + 1];
  return next === undefined ? SUBMIT : { kind: 'section', sectionId: next.id };
}

/**
 * The sections the respondent will see, in order, following the branching. Stops when a section
 * would be visited twice, so loops cannot run forever.
 */
export function getSectionPath(
  sections: readonly FormSection[],
  questions: readonly Question[],
  answers: AnswerMap,
): string[] {
  const first = sortSections(sections)[0];
  const path: string[] = [];
  let current: string | undefined = first?.id;

  while (current !== undefined && !path.includes(current) && sections.some((section) => section.id === current)) {
    path.push(current);
    const step: NextStep = getNextSection(sections, questions, answers, current);
    current = step.kind === 'section' ? step.sectionId : undefined;
  }
  return path;
}
