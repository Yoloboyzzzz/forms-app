import type { SectionPatch } from '@/services/mappers/recordMappers';
import { GO_TO_SUBMIT, type FormSection } from '@/types/models';

/** A section the editor can offer as a jump target. */
export interface SectionOption {
  id: string;
  label: string;
}

const GOTO_PREFIX = 'goto:';

/** The "after this section" choice as a single string, for a Select: `next`, `submit` or `goto:<sectionId>`. */
export function afterActionValue(section: FormSection): string {
  if (section.afterAction === 'goto' && section.goToSectionId !== undefined) {
    return `${GOTO_PREFIX}${section.goToSectionId}`;
  }
  return section.afterAction === 'submit' ? 'submit' : 'next';
}

/** The section fields to save for a value from `afterActionValue`. */
export function parseAfterActionValue(value: string): Pick<SectionPatch, 'afterAction' | 'goToSectionId'> {
  if (value === 'submit') return { afterAction: 'submit', goToSectionId: undefined };
  if (value.startsWith(GOTO_PREFIX)) return { afterAction: 'goto', goToSectionId: value.slice(GOTO_PREFIX.length) };
  return { afterAction: 'next', goToSectionId: undefined };
}

/** An option's jump as a Select value: `continue`, `submit` or a section id. */
export function jumpValue(goTo: string | undefined): string {
  return goTo ?? 'continue';
}

/** The `goTo` to store for a value from `jumpValue`; undefined means "continue". */
export function parseJumpValue(value: string): string | undefined {
  if (value === 'continue') return undefined;
  return value === 'submit' ? GO_TO_SUBMIT : value;
}
