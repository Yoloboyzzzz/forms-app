import type { Question, QuestionDraft } from '../types/models';
import { ServiceError, throwIfError, toServiceError } from './errors';
import { toQuestion, toQuestionPayload } from './mappers/questionMapper';
import { supabase } from './supabase/client';

export async function addQuestion(draft: QuestionDraft): Promise<Question> {
  const { data, error } = await supabase.from('form_questions').insert(toQuestionPayload(draft)).select('*').single();
  throwIfError(error);
  if (data === null) throw new ServiceError('unknown');
  return toQuestion(data);
}

/** Saves the whole question (title, options, settings, ...). */
export async function updateQuestion(questionId: string, draft: QuestionDraft): Promise<Question> {
  const { data, error } = await supabase
    .from('form_questions')
    .update(toQuestionPayload(draft))
    .eq('id', questionId)
    .select('*')
    .single();
  throwIfError(error);
  if (data === null) throw new ServiceError('unknown');
  return toQuestion(data);
}

/** Stores the order of the given questions: the first id becomes index 0, and so on. */
export async function reorderQuestions(orderedQuestionIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedQuestionIds.map((id, index) => supabase.from('form_questions').update({ order_index: index }).eq('id', id)),
  );
  results.forEach(({ error }) => throwIfError(error));
}

/** Copies a question into the same section, directly after the original. */
export async function duplicateQuestion(question: Question): Promise<Question> {
  const { id: _id, ...draft } = question;
  return addQuestion({ ...draft, orderIndex: question.orderIndex + 1 });
}

export async function setQuestionActive(questionId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('form_questions').update({ is_active: isActive }).eq('id', questionId);
  throwIfError(error);
}

/**
 * Removes a question. Questions that already have answers cannot be deleted (the database refuses),
 * so they are deactivated instead and hidden from new respondents.
 * @returns what happened to the question.
 */
export async function removeQuestion(questionId: string): Promise<'deleted' | 'deactivated'> {
  const { error } = await supabase.from('form_questions').delete().eq('id', questionId);
  if (error === null) {
    return 'deleted';
  }
  if (error.code !== '23503') {
    throw toServiceError(error);
  }
  await setQuestionActive(questionId, false);
  return 'deactivated';
}
