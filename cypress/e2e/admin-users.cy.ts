import en from '../../src/i18n/locales/en.json';
import { testIdFor, testIds } from '../../src/constants/testIds';

// Needs the admin account from cypress.env.json. Every run creates accounts with unique emails;
// the test project's seed data is reset to remove them (the app cannot delete auth users).

const NEW_PASSWORD = 'e2e-Chosen-Pass-1';

interface CreatedUser {
  email: string;
  name: string;
  temporaryPassword: string;
}

/** Creates an account through the admin UI and returns the temporary password shown once. */
function createUserViaUi(role: 'user' | 'admin' = 'user'): Cypress.Chainable<CreatedUser> {
  const stamp = Date.now();
  const email = `e2e+${stamp}@example.com`;
  const name = `E2E User ${stamp}`;

  cy.login(Cypress.env('adminEmail'), Cypress.env('adminPassword'));
  cy.getByTestId(testIds.adminForms.screen).should('exist');
  cy.visit('/admin/users/new');
  cy.getByTestId(testIds.createUser.nameInput).type(name);
  cy.getByTestId(testIds.createUser.emailInput).type(email);
  cy.getByTestId(testIdFor.createUserRole(role)).click();
  cy.getByTestId(testIds.createUser.generateButton).click();
  cy.getByTestId(testIds.createUser.submitButton).click();

  return cy
    .getByTestId(testIds.tempPassword.value)
    .invoke('text')
    .then((temporaryPassword) => {
      cy.getByTestId(testIds.tempPassword.closeButton).click();
      return cy.wrap({ email, name, temporaryPassword });
    });
}

function userItem(email: string): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.contains('[data-testid^="user-list-item-"]', email);
}

function signOutViaProfile(tab: string): void {
  cy.getByTestId(tab).click();
  cy.getByTestId(testIds.profile.logoutButton).click();
  cy.getByTestId(testIds.login.screen).should('exist');
}

describe('Admin users', () => {
  it('lists users and offers a new-user form', () => {
    cy.login(Cypress.env('adminEmail'), Cypress.env('adminPassword'));
    cy.getByTestId(testIds.tabs.adminUsers).click();
    cy.getByTestId(testIds.users.screen).should('exist');
    cy.getByTestId(testIds.users.list).should('exist');
    cy.getByTestId(testIds.users.newButton).click();
    cy.getByTestId(testIds.createUser.screen).should('exist');
  });

  it('validates the new-user form', () => {
    cy.login(Cypress.env('adminEmail'), Cypress.env('adminPassword'));
    cy.visit('/admin/users/new');
    cy.getByTestId(testIds.createUser.submitButton).click();
    cy.getByTestId(`${testIds.createUser.nameInput}-error`).should('exist');
    cy.getByTestId(`${testIds.createUser.emailInput}-error`).should('exist');
    cy.getByTestId(`${testIds.createUser.passwordInput}-error`).should('exist');
  });

  it('creates an account that appears in the list', () => {
    createUserViaUi().then(({ email }) => {
      cy.getByTestId(testIds.users.list).should('contain.text', email);
    });
  });

  it('rejects an email that is already used', () => {
    cy.login(Cypress.env('adminEmail'), Cypress.env('adminPassword'));
    cy.visit('/admin/users/new');
    cy.getByTestId(testIds.createUser.nameInput).type('Duplicate');
    cy.getByTestId(testIds.createUser.emailInput).type(Cypress.env('userEmail'));
    cy.getByTestId(testIds.createUser.generateButton).click();
    cy.getByTestId(testIds.createUser.submitButton).click();
    cy.getByTestId(testIds.createUser.errorText).should('contain.text', en.errors.duplicate);
  });

  it('forces a new user to choose a password, deep links included, then lets them in', () => {
    createUserViaUi().then(({ email, temporaryPassword }) => {
      signOutViaProfile(testIds.tabs.adminProfile);

      cy.login(email, temporaryPassword);
      cy.getByTestId(testIds.changePassword.screen).should('exist');

      cy.visit('/user/forms');
      cy.getByTestId(testIds.changePassword.screen).should('exist');
      cy.getByTestId(testIds.userForms.screen).should('not.exist');

      cy.getByTestId(testIds.changePassword.newPasswordInput).type(NEW_PASSWORD);
      cy.getByTestId(testIds.changePassword.confirmPasswordInput).type(NEW_PASSWORD);
      cy.getByTestId(testIds.changePassword.submitButton).click();
      cy.getByTestId(testIds.userForms.screen).should('exist');

      signOutViaProfile(testIds.tabs.userProfile);

      // the changed password works on the next login, the temporary one no longer does
      cy.login(email, NEW_PASSWORD);
      cy.getByTestId(testIds.userForms.screen).should('exist');
    });
  });

  it('does not accept the temporary password after it was changed', () => {
    createUserViaUi().then(({ email, temporaryPassword }) => {
      signOutViaProfile(testIds.tabs.adminProfile);
      cy.login(email, temporaryPassword);
      cy.getByTestId(testIds.changePassword.newPasswordInput).type(NEW_PASSWORD);
      cy.getByTestId(testIds.changePassword.confirmPasswordInput).type(NEW_PASSWORD);
      cy.getByTestId(testIds.changePassword.submitButton).click();
      cy.getByTestId(testIds.userForms.screen).should('exist');
      signOutViaProfile(testIds.tabs.userProfile);

      cy.login(email, temporaryPassword);
      cy.getByTestId(testIds.login.errorText).should('exist');
    });
  });

  it('resets a password and forces another change', () => {
    createUserViaUi().then(({ email, temporaryPassword }) => {
      // the user activates the account first
      signOutViaProfile(testIds.tabs.adminProfile);
      cy.login(email, temporaryPassword);
      cy.getByTestId(testIds.changePassword.newPasswordInput).type(NEW_PASSWORD);
      cy.getByTestId(testIds.changePassword.confirmPasswordInput).type(NEW_PASSWORD);
      cy.getByTestId(testIds.changePassword.submitButton).click();
      cy.getByTestId(testIds.userForms.screen).should('exist');
      signOutViaProfile(testIds.tabs.userProfile);

      // the admin resets it
      cy.login(Cypress.env('adminEmail'), Cypress.env('adminPassword'));
      cy.getByTestId(testIds.tabs.adminUsers).click();
      userItem(email).find('[data-testid$="-reset-button"]').click();
      cy.getByTestId(`${testIds.users.confirmDialog}-confirm`).click();
      cy.getByTestId(testIds.tempPassword.value)
        .invoke('text')
        .then((resetPassword) => {
          cy.getByTestId(testIds.tempPassword.closeButton).click();
          signOutViaProfile(testIds.tabs.adminProfile);

          cy.login(email, resetPassword);
          cy.getByTestId(testIds.changePassword.screen).should('exist');
        });
    });
  });

  it('changes a role after confirmation', () => {
    createUserViaUi().then(({ email }) => {
      cy.getByTestId(testIds.tabs.adminUsers).click();
      userItem(email).find('[data-testid$="-role-button"]').click();
      cy.getByTestId(`${testIds.users.confirmDialog}-confirm`).click();
      userItem(email).should('contain.text', en.role.admin);
    });
  });

  it('keeps users out of the admin screens', () => {
    cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
    cy.visit('/admin/users');
    cy.getByTestId(testIds.users.screen).should('not.exist');
    cy.getByTestId(testIds.userForms.screen).should('exist');
  });
});
