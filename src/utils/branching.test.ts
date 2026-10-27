import { makeQuestion, makeSection } from '@/testUtils/factories';
import type { AnswerMap } from './branching';
import { getNextSection, getSectionPath } from './branching';

const sections = [makeSection('s1', 0), makeSection('s2', 1), makeSection('s3', 2)];

const choice = (id: string, sectionId: string, goTos: Record<string, string | undefined>, extra = {}) =>
  makeQuestion(id, {
    sectionId,
    questionType: 'multiple_choice',
    options: Object.entries(goTos).map(([optionId, goTo]) => ({ id: optionId, label: optionId, goTo })),
    settings: { goToSectionBasedOnAnswer: true },
    ...extra,
  });

const answer = (questionId: string, optionId: string): AnswerMap => ({ [questionId]: { optionId } });

describe('getNextSection', () => {
  it('goes to the next section by position', () => {
    expect(getNextSection(sections, [], {}, 's1')).toEqual({ kind: 'section', sectionId: 's2' });
    expect(getNextSection(sections, [], {}, 's2')).toEqual({ kind: 'section', sectionId: 's3' });
  });

  it('submits after the last section', () => {
    expect(getNextSection(sections, [], {}, 's3')).toEqual({ kind: 'submit' });
  });

  it('orders sections by position, not by the given order', () => {
    const shuffled = [sections[2], sections[0], sections[1]];
    expect(getNextSection(shuffled, [], {}, 's1')).toEqual({ kind: 'section', sectionId: 's2' });
  });

  it('submits for an unknown section', () => {
    expect(getNextSection(sections, [], {}, 'nope')).toEqual({ kind: 'submit' });
  });

  describe('after this section', () => {
    it('can submit', () => {
      const list = [makeSection('s1', 0, { afterAction: 'submit' }), makeSection('s2', 1)];
      expect(getNextSection(list, [], {}, 's1')).toEqual({ kind: 'submit' });
    });

    it('can jump to a section', () => {
      const list = [makeSection('s1', 0, { afterAction: 'goto', goToSectionId: 's3' }), makeSection('s2', 1), makeSection('s3', 2)];
      expect(getNextSection(list, [], {}, 's1')).toEqual({ kind: 'section', sectionId: 's3' });
    });

    it('continues normally when a jump has no target', () => {
      const list = [makeSection('s1', 0, { afterAction: 'goto' }), makeSection('s2', 1)];
      expect(getNextSection(list, [], {}, 's1')).toEqual({ kind: 'section', sectionId: 's2' });
    });
  });

  describe('go to section based on answer', () => {
    const question = choice('q1', 's1', { yes: undefined, skip: 's3', stop: 'submit', gone: 'deleted-section' });

    it('follows the option the respondent picked', () => {
      expect(getNextSection(sections, [question], answer('q1', 'skip'), 's1')).toEqual({ kind: 'section', sectionId: 's3' });
    });

    it('can end the form', () => {
      expect(getNextSection(sections, [question], answer('q1', 'stop'), 's1')).toEqual({ kind: 'submit' });
    });

    it('continues normally for options without a jump', () => {
      expect(getNextSection(sections, [question], answer('q1', 'yes'), 's1')).toEqual({ kind: 'section', sectionId: 's2' });
    });

    it('ignores a jump to a section that was deleted', () => {
      expect(getNextSection(sections, [question], answer('q1', 'gone'), 's1')).toEqual({ kind: 'section', sectionId: 's2' });
    });

    it('wins over the section setting', () => {
      const list = [makeSection('s1', 0, { afterAction: 'submit' }), makeSection('s2', 1), makeSection('s3', 2)];
      expect(getNextSection(list, [question], answer('q1', 'skip'), 's1')).toEqual({ kind: 'section', sectionId: 's3' });
    });

    it('falls back to the section setting without an answer', () => {
      const list = [makeSection('s1', 0, { afterAction: 'submit' }), makeSection('s2', 1)];
      expect(getNextSection(list, [question], {}, 's1')).toEqual({ kind: 'submit' });
    });

    it('ignores an "other" answer or an unknown option', () => {
      expect(getNextSection(sections, [question], { q1: { other: 'x' } }, 's1')).toEqual({ kind: 'section', sectionId: 's2' });
      expect(getNextSection(sections, [question], answer('q1', 'unknown'), 's1')).toEqual({ kind: 'section', sectionId: 's2' });
    });

    it('ignores answers of other shapes', () => {
      expect(getNextSection(sections, [question], { q1: 'text' }, 's1')).toEqual({ kind: 'section', sectionId: 's2' });
      expect(getNextSection(sections, [question], { q1: ['a'] }, 's1')).toEqual({ kind: 'section', sectionId: 's2' });
      expect(getNextSection(sections, [question], { q1: 3 }, 's1')).toEqual({ kind: 'section', sectionId: 's2' });
    });

    it('only looks at the jump setting when it is switched on', () => {
      const off = choice('q1', 's1', { skip: 's3' }, { settings: {} });
      expect(getNextSection(sections, [off], answer('q1', 'skip'), 's1')).toEqual({ kind: 'section', sectionId: 's2' });
    });

    it('ignores deactivated questions', () => {
      const inactive = choice('q1', 's1', { skip: 's3' }, { isActive: false });
      expect(getNextSection(sections, [inactive], answer('q1', 'skip'), 's1')).toEqual({ kind: 'section', sectionId: 's2' });
    });

    it('ignores questions of other sections', () => {
      const elsewhere = choice('q1', 's2', { skip: 's3' });
      expect(getNextSection(sections, [elsewhere], answer('q1', 'skip'), 's1')).toEqual({ kind: 'section', sectionId: 's2' });
    });

    it('uses the first question (by position) that has a jump for the answer', () => {
      const first = choice('first', 's1', { a: 's3' }, { orderIndex: 0 });
      const second = choice('second', 's1', { b: 'submit' }, { orderIndex: 1 });
      const answers: AnswerMap = { first: { optionId: 'a' }, second: { optionId: 'b' } };
      expect(getNextSection(sections, [second, first], answers, 's1')).toEqual({ kind: 'section', sectionId: 's3' });
    });

    it('works for dropdowns too', () => {
      const dropdown = makeQuestion('d1', {
        sectionId: 's1',
        questionType: 'dropdown',
        options: [{ id: 'x', label: 'X', goTo: 's3' }],
        settings: { goToSectionBasedOnAnswer: true },
      });
      expect(getNextSection(sections, [dropdown], answer('d1', 'x'), 's1')).toEqual({ kind: 'section', sectionId: 's3' });
    });

    it('does not branch on other question types', () => {
      const text = makeQuestion('t1', { sectionId: 's1' });
      expect(getNextSection(sections, [text], { t1: 'hello' }, 's1')).toEqual({ kind: 'section', sectionId: 's2' });
    });
  });
});

describe('getSectionPath', () => {
  it('follows the sections in order', () => {
    expect(getSectionPath(sections, [], {})).toEqual(['s1', 's2', 's3']);
  });

  it('skips sections that a jump passes over', () => {
    const question = choice('q1', 's1', { skip: 's3' });
    expect(getSectionPath(sections, [question], answer('q1', 'skip'))).toEqual(['s1', 's3']);
  });

  it('ends early when an option submits', () => {
    const question = choice('q1', 's1', { stop: 'submit' });
    expect(getSectionPath(sections, [question], answer('q1', 'stop'))).toEqual(['s1']);
  });

  it('stops when branching loops back', () => {
    const looping = [makeSection('s1', 0), makeSection('s2', 1, { afterAction: 'goto', goToSectionId: 's1' })];
    expect(getSectionPath(looping, [], {})).toEqual(['s1', 's2']);
  });

  it('is empty without sections', () => {
    expect(getSectionPath([], [], {})).toEqual([]);
  });

  it('ends when a section jumps to a missing section', () => {
    const list = [makeSection('s1', 0, { afterAction: 'goto', goToSectionId: 'gone' })];
    expect(getSectionPath(list, [], {})).toEqual(['s1']);
  });
});
