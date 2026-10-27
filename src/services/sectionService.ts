import type { FormSection } from '../types/models';
import { ServiceError, throwIfError } from './errors';
import {
  toSection,
  toSectionInsert,
  toSectionUpdate,
  type SectionDraft,
  type SectionPatch,
} from './mappers/recordMappers';
import { supabase } from './supabase/client';

/** Adds a section at the given position. */
export async function addSection(draft: SectionDraft): Promise<FormSection> {
  const { data, error } = await supabase.from('form_sections').insert(toSectionInsert(draft)).select('*').single();
  throwIfError(error);
  if (data === null) throw new ServiceError('unknown');
  return toSection(data);
}

/** Changes title, description, order or what happens after the section. */
export async function updateSection(sectionId: string, patch: SectionPatch): Promise<FormSection> {
  const { data, error } = await supabase
    .from('form_sections')
    .update(toSectionUpdate(patch))
    .eq('id', sectionId)
    .select('*')
    .single();
  throwIfError(error);
  if (data === null) throw new ServiceError('unknown');
  return toSection(data);
}

/** Stores the order of the given sections: the first id becomes index 0, and so on. */
export async function reorderSections(orderedSectionIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedSectionIds.map((id, index) => supabase.from('form_sections').update({ order_index: index }).eq('id', id)),
  );
  results.forEach(({ error }) => throwIfError(error));
}

/**
 * Deletes a section and its questions.
 * @throws ServiceError `inUse` when a question in it already has answers.
 */
export async function deleteSection(sectionId: string): Promise<void> {
  const { error } = await supabase.from('form_sections').delete().eq('id', sectionId);
  throwIfError(error);
}
