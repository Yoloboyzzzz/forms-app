import { testIds } from '../../src/constants/testIds';

// Credentials come from cypress.env.json (see cypress.env.example.json), never from this file.
describe('Login screen', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('renders the login form', () => {
    cy.getByTestId(testIds.login.screen).should('exist');
    cy.getByTestId(testIds.login.emailInput).should('exist');
    cy.getByTestId(testIds.login.passwordInput).should('exist');
    cy.getByTestId(testIds.login.submitButton).should('exist');
    cy.getByTestId(testIds.login.forgotPasswordLink).should('exist');
  });

  it('shows inline errors for empty fields', () => {
    cy.getByTestId(testIds.login.submitButton).click();
    cy.getByTestId(`${testIds.login.emailInput}-error`).should('exist');
    cy.getByTestId(`${testIds.login.passwordInput}-error`).should('exist');
  });

  it('shows an error for wrong credentials', () => {
    cy.getByTestId(testIds.login.emailInput).type(Cypress.env('userEmail'));
    cy.getByTestId(testIds.login.passwordInput).type('definitely-not-the-password');
    cy.getByTestId(testIds.login.submitButton).click();
    cy.getByTestId(testIds.login.errorText).should('exist');
    cy.url().should('include', '/login');
  });

  it('logs a user in and shows their forms', () => {
    cy.getByTestId(testIds.login.emailInput).type(Cypress.env('userEmail'));
    cy.getByTestId(testIds.login.passwordInput).type(Cypress.env('userPassword'), { log: false });
    cy.getByTestId(testIds.login.submitButton).click();
    cy.getByTestId(testIds.userForms.screen).should('exist');
  });

  it('logs an admin in and shows the admin forms', () => {
    cy.getByTestId(testIds.login.emailInput).type(Cypress.env('adminEmail'));
    cy.getByTestId(testIds.login.passwordInput).type(Cypress.env('adminPassword'), { log: false });
    cy.getByTestId(testIds.login.submitButton).click();
    cy.getByTestId(testIds.adminForms.screen).should('exist');
  });
});
