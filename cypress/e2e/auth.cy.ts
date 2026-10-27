import en from '../../src/i18n/locales/en.json';
import nl from '../../src/i18n/locales/nl.json';
import { testIdFor, testIds } from '../../src/constants/testIds';

// Accounts come from cypress.env.json (see cypress.env.example.json).
// Texts are never selected; where a language is checked, the expected text is read from the locale files.

describe('Route protection', () => {
  it('sends signed-out visitors from a protected page to login', () => {
    cy.visit('/admin/forms');
    cy.url().should('include', '/login');
    cy.getByTestId(testIds.login.screen).should('exist');
  });

  it('sends signed-out visitors from the user area to login', () => {
    cy.visit('/user/forms');
    cy.url().should('include', '/login');
  });
});

describe('Role based redirect', () => {
  it('lands a user in the user area and keeps them out of the admin area', () => {
    cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
    cy.getByTestId(testIds.userForms.screen).should('exist');

    cy.visit('/admin/forms');
    cy.getByTestId(testIds.userForms.screen).should('exist');
    cy.getByTestId(testIds.adminForms.screen).should('not.exist');
  });

  it('lands an admin in the admin area and keeps them out of the user area', () => {
    cy.login(Cypress.env('adminEmail'), Cypress.env('adminPassword'));
    cy.getByTestId(testIds.adminForms.screen).should('exist');

    cy.visit('/user/forms');
    cy.getByTestId(testIds.adminForms.screen).should('exist');
    cy.getByTestId(testIds.userForms.screen).should('not.exist');
  });

  it('keeps signed-in users away from the login screen', () => {
    cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
    cy.getByTestId(testIds.userForms.screen).should('exist');
    cy.visit('/login');
    cy.getByTestId(testIds.userForms.screen).should('exist');
  });
});

describe('Logout', () => {
  it('signs the user out from the profile and blocks protected pages afterwards', () => {
    cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
    cy.getByTestId(testIds.tabs.userProfile).click();
    cy.getByTestId(testIds.profile.screen).should('exist');
    cy.getByTestId(testIds.profile.logoutButton).click();

    cy.getByTestId(testIds.login.screen).should('exist');
    cy.visit('/user/forms');
    cy.url().should('include', '/login');
  });
});

// The forced password change is covered end to end in admin-users.cy.ts, where the account is created by an admin.

describe('Forgot password', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.getByTestId(testIds.login.forgotPasswordLink).click();
  });

  it('opens from the login screen and goes back', () => {
    cy.getByTestId(testIds.forgotPassword.screen).should('exist');
    cy.getByTestId(testIds.forgotPassword.backToLoginLink).click();
    cy.getByTestId(testIds.login.screen).should('exist');
  });

  it('validates the email', () => {
    cy.getByTestId(testIds.forgotPassword.emailInput).type('not-an-email');
    cy.getByTestId(testIds.forgotPassword.sendCodeButton).click();
    cy.getByTestId(`${testIds.forgotPassword.emailInput}-error`).should('exist');
  });

  it('shows the same neutral message for an address without an account', () => {
    cy.getByTestId(testIds.forgotPassword.emailInput).type(`nobody+${Date.now()}@example.com`);
    cy.getByTestId(testIds.forgotPassword.sendCodeButton).click();
    cy.getByTestId(testIds.forgotPassword.neutralMessage).should('contain.text', nl.forgotPassword.neutralMessage);
    cy.getByTestId(testIds.forgotPassword.codeInput).should('exist');
  });

  it('rejects a wrong code', () => {
    cy.getByTestId(testIds.forgotPassword.emailInput).type(`nobody+${Date.now()}@example.com`);
    cy.getByTestId(testIds.forgotPassword.sendCodeButton).click();
    cy.getByTestId(testIds.forgotPassword.codeInput).type('000000');
    cy.getByTestId(testIds.forgotPassword.newPasswordInput).type('a-brand-new-password-1');
    cy.getByTestId(testIds.forgotPassword.confirmPasswordInput).type('a-brand-new-password-1');
    cy.getByTestId(testIds.forgotPassword.submitButton).click();
    cy.getByTestId(testIds.forgotPassword.errorText).should('exist');
  });

  it('validates the code format inline', () => {
    cy.getByTestId(testIds.forgotPassword.emailInput).type(`nobody+${Date.now()}@example.com`);
    cy.getByTestId(testIds.forgotPassword.sendCodeButton).click();
    cy.getByTestId(testIds.forgotPassword.codeInput).type('12');
    cy.getByTestId(testIds.forgotPassword.submitButton).click();
    cy.getByTestId(`${testIds.forgotPassword.codeInput}-error`).should('exist');
  });
});

describe('Language', () => {
  it('switches the profile between Dutch and English', () => {
    cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
    cy.getByTestId(testIds.tabs.userProfile).click();

    cy.getByTestId(testIdFor.languageOption('nl')).click();
    cy.getByTestId(testIds.profile.changePasswordToggle).should('contain.text', nl.profile.changePassword);

    cy.getByTestId(testIdFor.languageOption('en')).click();
    cy.getByTestId(testIds.profile.changePasswordToggle).should('contain.text', en.profile.changePassword);
  });

  it('keeps the chosen language after a reload', () => {
    cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
    cy.getByTestId(testIds.tabs.userProfile).click();
    cy.getByTestId(testIdFor.languageOption('nl')).click();

    cy.reload();
    cy.getByTestId(testIds.profile.changePasswordToggle).should('contain.text', nl.profile.changePassword);

    // restore the default so other specs see English labels where they check them
    cy.getByTestId(testIdFor.languageOption('en')).click();
  });
});
