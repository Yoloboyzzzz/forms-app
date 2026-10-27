import type { Form } from '@/types/models';

/** Whether a form currently accepts responses: switched on and not past its closing time. */
export function isFormOpen(form: Pick<Form, 'isAcceptingResponses' | 'closesAt'>, now: Date): boolean {
  if (!form.isAcceptingResponses) return false;
  return form.closesAt === undefined || form.closesAt.getTime() > now.getTime();
}
