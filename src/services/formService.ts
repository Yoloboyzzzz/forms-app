import type { FormStatus } from '../types/enums';
import { GO_TO_SUBMIT, type Form, type FormDetail, type Question, type QuestionDraft } from '../types/models';
import { ServiceError, throwIfError } from './errors';
import { toQuestion, toQuestionPayload } from './mappers/questionMapper';
import {
  toForm,
  toFormCopyInsert,
  toFormInsert,
  toFormUpdate,
  toSection,
  toSectionUpdate,
  type FormPatch,
} from './mappers/recordMappers';
import { supabase } from './supabase/client';

/** Forms sorted by last change, newest first; optionally only one status. */
export async function listForms(status?: FormStatus): Promise<Form[]> {
  let query = supabase.from('forms').select('*').order('updated_at', { ascending: false });
  if (status !== undefined) {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []).map(toForm);
}

/**
 * Loads a form with its sections and questions (including deactivated ones, for the editor).
 * @throws ServiceError `notFound`.
 */
export async function getFormDetail(formId: string): Promise<FormDetail> {
  const [formResult, sectionsResult, questionsResult] = await Promise.all([
    supabase.from('forms').select('*').eq('id', formId).maybeSingle(),
    supabase.from('form_sections').select('*').eq('form_id', formId).order('order_index', { ascending: true }),
    supabase.from('form_questions').select('*').eq('form_id', formId).order('order_index', { ascending: true }),
  ]);
  throwIfError(formResult.error);
  throwIfError(sectionsResult.error);
  throwIfError(questionsResult.error);
  if (formResult.data === null) {
    throw new ServiceError('notFound');
  }
  return {
    form: toForm(formResult.data),
    sections: (sectionsResult.data ?? []).map(toSection),
    questions: (questionsResult.data ?? []).map(toQuestion),
  };
}

/** Creates a draft. The database adds the first section. */
export async function createForm(draft: { title: string; description?: string }, createdBy: string): Promise<Form> {
  const { data, error } = await supabase.from('forms').insert(toFormInsert(draft, createdBy)).select('*').single();
  throwIfError(error);
  if (data === null) throw new ServiceError('unknown');
  return toForm(data);
}

/** Changes title, description or settings. */
export async function updateForm(formId: string, patch: FormPatch): Promise<Form> {
  const { data, error } = await supabase
    .from('forms')
    .update(toFormUpdate(patch))
    .eq('id', formId)
    .select('*')
    .single();
  throwIfError(error);
  if (data === null) throw new ServiceError('unknown');
  return toForm(data);
}

/**
 * Publishes a draft so assigned users can fill it in.
 * @throws ServiceError `invalidInput` when the form has no active question.
 */
export async function publishForm(formId: string): Promise<Form> {
  const { count, error: countError } = await supabase
    .from('form_questions')
    .select('id', { count: 'exact', head: true })
    .eq('form_id', formId)
    .eq('is_active', true);
  throwIfError(countError);
  if (count === null || count === 0) {
    throw new ServiceError('invalidInput');
  }
  const { data, error } = await supabase
    .from('forms')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', formId)
    .select('*')
    .single();
  throwIfError(error);
  if (data === null) throw new ServiceError('unknown');
  return toForm(data);
}

/** Archives a form: it disappears for users but keeps its responses. */
export async function archiveForm(formId: string): Promise<Form> {
  const { data, error } = await supabase
    .from('forms')
    .update({ status: 'archived' })
    .eq('id', formId)
    .select('*')
    .single();
  throwIfError(error);
  if (data === null) throw new ServiceError('unknown');
  return toForm(data);
}

/**
 * Deletes a form that has no responses.
 * @throws ServiceError `inUse` when it has answers (archive it instead).
 */
export async function deleteForm(formId: string): Promise<void> {
  const { error } = await supabase.from('forms').delete().eq('id', formId);
  throwIfError(error);
}

/** Moves branching targets to the copied sections. Targets that are not sections ('submit') stay. */
function remapGoTo(question: Question, sectionIds: Map<string, string>): QuestionDraft {
  const { id: _id, ...draft } = question;
  const target = sectionIds.get(question.sectionId);
  if (target === undefined) {
    throw new ServiceError('unknown');
  }
  const moved: QuestionDraft = { ...draft, sectionId: target };
  if (moved.questionType === 'multiple_choice' || moved.questionType === 'checkboxes' || moved.questionType === 'dropdown') {
    moved.options = moved.options.map((option) => ({
      ...option,
      goTo: option.goTo === undefined || option.goTo === GO_TO_SUBMIT ? option.goTo : sectionIds.get(option.goTo),
    }));
  }
  return moved;
}

/**
 * Copies a form with its settings, sections, branching and active questions into a new draft.
 * Used for bigger changes to a form that already has responses (AGENTS.md D5).
 */
export async function duplicateForm(formId: string, title: string, createdBy: string): Promise<Form> {
  const source = await getFormDetail(formId);
  const { data: created, error } = await supabase
    .from('forms')
    .insert(toFormCopyInsert(source.form, title, createdBy))
    .select('*')
    .single();
  throwIfError(error);
  if (created === null) throw new ServiceError('unknown');

  // The database already gave the copy an empty first section; reuse it for the first source section.
  const { data: autoSections, error: autoError } = await supabase
    .from('form_sections')
    .select('*')
    .eq('form_id', created.id)
    .order('order_index', { ascending: true })
    .limit(1);
  throwIfError(autoError);
  const autoSection = autoSections?.[0];
  if (autoSection === undefined) throw new ServiceError('unknown');

  const sectionIds = new Map<string, string>();
  for (const [index, section] of source.sections.entries()) {
    const fields = { title: section.title, description: section.description, orderIndex: section.orderIndex };
    if (index === 0) {
      const { error: updateError } = await supabase
        .from('form_sections')
        .update(toSectionUpdate(fields))
        .eq('id', autoSection.id);
      throwIfError(updateError);
      sectionIds.set(section.id, autoSection.id);
    } else {
      const { data, error: insertError } = await supabase
        .from('form_sections')
        .insert({
          form_id: created.id,
          title: section.title ?? null,
          description: section.description ?? null,
          order_index: section.orderIndex,
        })
        .select('id')
        .single();
      throwIfError(insertError);
      if (data === null) throw new ServiceError('unknown');
      sectionIds.set(section.id, data.id);
    }
  }

  // After-section jumps point at other sections, so they are set once every copy exists.
  for (const section of source.sections) {
    const newId = sectionIds.get(section.id);
    if (newId === undefined || section.afterAction === 'next') continue;
    const { error: jumpError } = await supabase
      .from('form_sections')
      .update(
        toSectionUpdate({
          afterAction: section.afterAction,
          goToSectionId: section.goToSectionId === undefined ? undefined : sectionIds.get(section.goToSectionId),
        }),
      )
      .eq('id', newId);
    throwIfError(jumpError);
  }

  const activeQuestions = source.questions.filter((question) => question.isActive);
  if (activeQuestions.length > 0) {
    const rows = activeQuestions.map((question) => ({
      ...toQuestionPayload(remapGoTo(question, sectionIds)),
      form_id: created.id,
    }));
    const { error: questionsError } = await supabase.from('form_questions').insert(rows);
    throwIfError(questionsError);
  }

  return toForm(created);
}
