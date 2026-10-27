/**
 * testIDs shared by components and Cypress specs (AGENTS.md §8.1).
 * Format: kebab-case `<screen-or-component>-<element>[-<qualifier>]`; dynamic ids use record ids, never indexes.
 * Add ids here together with the component that uses them.
 */
export const testIds = {
  login: {
    screen: 'login-screen',
    emailInput: 'login-email-input',
    passwordInput: 'login-password-input',
    submitButton: 'login-submit-button',
    errorText: 'login-error-text',
    forgotPasswordLink: 'login-forgot-password-link',
  },
  changePassword: {
    screen: 'change-password-screen',
    newPasswordInput: 'change-password-new-input',
    confirmPasswordInput: 'change-password-confirm-input',
    submitButton: 'change-password-submit-button',
    logoutButton: 'change-password-logout-button',
    errorText: 'change-password-error-text',
  },
  forgotPassword: {
    screen: 'forgot-password-screen',
    emailInput: 'forgot-password-email-input',
    sendCodeButton: 'forgot-password-send-code-button',
    neutralMessage: 'forgot-password-neutral-message',
    codeInput: 'forgot-password-code-input',
    newPasswordInput: 'forgot-password-new-password-input',
    confirmPasswordInput: 'forgot-password-confirm-input',
    resendButton: 'forgot-password-resend-button',
    backToLoginLink: 'forgot-password-back-link',
    submitButton: 'forgot-password-submit-button',
    errorText: 'forgot-password-error-text',
  },
  profile: {
    screen: 'profile-screen',
    nameInput: 'profile-name-input',
    saveNameButton: 'profile-save-name-button',
    nameSavedMessage: 'profile-name-saved-message',
    changePasswordToggle: 'profile-change-password-toggle',
    passwordSavedMessage: 'profile-password-saved-message',
    logoutButton: 'profile-logout-button',
    emailText: 'profile-email-text',
  },
  tabs: {
    adminForms: 'tab-admin-forms',
    adminUsers: 'tab-admin-users',
    adminProfile: 'tab-admin-profile',
    userForms: 'tab-user-forms',
    userProfile: 'tab-user-profile',
  },
  users: {
    screen: 'admin-users-screen',
    list: 'admin-users-list',
    newButton: 'admin-users-new-button',
    loadError: 'admin-users-load-error',
    retryButton: 'admin-users-retry-button',
    empty: 'admin-users-empty',
    loading: 'admin-users-loading',
    confirmDialog: 'admin-users-confirm-dialog',
    actionError: 'admin-users-action-error',
  },
  tempPassword: {
    dialog: 'temp-password-dialog',
    value: 'temp-password-value',
    copyButton: 'temp-password-copy-button',
    closeButton: 'temp-password-close-button',
  },
  createUser: {
    screen: 'create-user-screen',
    nameInput: 'create-user-name-input',
    emailInput: 'create-user-email-input',
    passwordInput: 'create-user-password-input',
    generateButton: 'create-user-generate-button',
    copyButton: 'create-user-copy-button',
    submitButton: 'create-user-submit-button',
    errorText: 'create-user-error-text',
  },
  adminForms: {
    screen: 'admin-forms-screen',
  },
  userForms: {
    screen: 'user-forms-screen',
  },
} as const;

export const testIdFor = {
  languageOption: (language: string): string => `language-option-${language}`,
  formCard: (formId: string): string => `form-card-${formId}`,
  questionInput: (questionId: string): string => `question-${questionId}-input`,
  questionOption: (questionId: string, optionId: string): string => `question-${questionId}-option-${optionId}`,
  assignmentCard: (assignmentId: string): string => `assignment-card-${assignmentId}`,
  userListItem: (userId: string): string => `user-list-item-${userId}`,
  userResetButton: (userId: string): string => `user-list-item-${userId}-reset-button`,
  userRoleButton: (userId: string): string => `user-list-item-${userId}-role-button`,
  createUserRole: (role: string): string => `create-user-role-${role}`,
} as const;
