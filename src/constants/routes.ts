/** Route helpers (AGENTS.md §9). Params are ids only. */
export const routes = {
  login: '/login',
  changePassword: '/change-password',
  forgotPassword: '/forgot-password',
  home: '/',
  profile: '/profile',
  admin: {
    forms: '/admin/forms',
    newForm: '/admin/forms/new',
    formEdit: (formId: string) => `/admin/forms/${formId}/edit`,
    formSettings: (formId: string) => `/admin/forms/${formId}/settings`,
    formPreview: (formId: string) => `/admin/forms/${formId}/preview`,
    formAssign: (formId: string) => `/admin/forms/${formId}/assign`,
    formResponses: (formId: string) => `/admin/forms/${formId}/responses`,
    submission: (submissionId: string) => `/admin/submissions/${submissionId}`,
    users: '/admin/users',
    newUser: '/admin/users/new',
  },
  user: {
    forms: '/user/forms',
    fill: (assignmentId: string) => `/user/forms/${assignmentId}`,
    done: (assignmentId: string) => `/user/forms/${assignmentId}/done`,
  },
} as const;
