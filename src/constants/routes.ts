/**
 * Route helpers (AGENTS.md §9). Params are ids only.
 * Dynamic helpers declare template-literal return types so they satisfy Expo Router's typed routes.
 */
export const routes = {
  login: '/login',
  changePassword: '/change-password',
  forgotPassword: '/forgot-password',
  home: '/',
  admin: {
    forms: '/admin/forms',
    newForm: '/admin/forms/new',
    formEdit: (formId: string): `/admin/forms/${string}/edit` => `/admin/forms/${formId}/edit`,
    formSettings: (formId: string): `/admin/forms/${string}/settings` => `/admin/forms/${formId}/settings`,
    formPreview: (formId: string): `/admin/forms/${string}/preview` => `/admin/forms/${formId}/preview`,
    formAssign: (formId: string): `/admin/forms/${string}/assign` => `/admin/forms/${formId}/assign`,
    formResponses: (formId: string): `/admin/forms/${string}/responses` => `/admin/forms/${formId}/responses`,
    submission: (formId: string, submissionId: string): `/admin/forms/${string}/responses/${string}` =>
      `/admin/forms/${formId}/responses/${submissionId}`,
    profile: '/admin/profile',
    users: '/admin/users',
    newUser: '/admin/users/new',
  },
  user: {
    forms: '/user/forms',
    profile: '/user/profile',
    fill: (assignmentId: string): `/user/forms/${string}` => `/user/forms/${assignmentId}`,
    done: (assignmentId: string): `/user/forms/${string}/done` => `/user/forms/${assignmentId}/done`,
  },
} as const;
