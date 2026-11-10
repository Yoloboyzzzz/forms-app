import { testIds } from '../../src/constants/testIds';
import { createForm, createPublishedFormFor, addQuestion, assignOpenFormTo } from '../support/formFlows';

// Needs the admin, user and user2 accounts from cypress.env.json.

function signOut(tab: string): void {
  cy.getByTestId(tab).click();
  cy.getByTestId(testIds.profile.logoutButton).click();
  cy.getByTestId(testIds.login.screen).should('exist');
}

describe('Assigning forms', () => {
  it('assigns a form with a due date and lists the assignee', () => {
    createForm().then(() => {
      addQuestion('short_answer');
      cy.get('[data-testid^="question-"][data-testid$="-title-input"]').should('exist');
      assignOpenFormTo('userEmail');
    });
  });

  it('validates the due date', () => {
    createForm().then(() => {
      cy.getByTestId(testIds.editorActions.assign).click();
      cy.getByTestId(testIds.assign.dueDateInput).type('not a date');
      cy.getByTestId(`${testIds.assign.dueDateInput}-error`).should('exist');
    });
  });

  it('unassigns after confirmation', () => {
    createForm().then(() => {
      addQuestion('short_answer');
      cy.get('[data-testid^="question-"][data-testid$="-title-input"]').should('exist');
      assignOpenFormTo('userEmail');
      cy.get('[data-testid^="assignee-"][data-testid$="-unassign-button"]').first().click();
      cy.getByTestId(`${testIds.assign.unassignDialog}-confirm`).click();
      cy.getByTestId(testIds.assign.noneAssigned).should('exist');
    });
  });
});

describe('What users see', () => {
  it('shows an assigned, published form to the assigned user only', () => {
    createPublishedFormFor('userEmail').then((title) => {
      signOut(testIds.tabs.adminProfile);

      cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
      cy.getByTestId(testIds.userForms.list).should('contain.text', title);
      signOut(testIds.tabs.userProfile);

      cy.login(Cypress.env('user2Email'), Cypress.env('user2Password'));
      cy.getByTestId(testIds.userForms.screen).should('exist');
      cy.getByTestId(testIds.userForms.screen).should('not.contain.text', title);
    });
  });

  it('does not show a draft form even when it is assigned', () => {
    createForm().then((title) => {
      addQuestion('short_answer');
      cy.get('[data-testid^="question-"][data-testid$="-title-input"]').should('exist');
      assignOpenFormTo('userEmail');
      signOut(testIds.tabs.adminProfile);

      cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
      cy.getByTestId(testIds.userForms.screen).should('exist');
      cy.getByTestId(testIds.userForms.screen).should('not.contain.text', title);
    });
  });

  it('shows a not-found state when a user opens a form that was not assigned to them', () => {
    cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
    cy.getByTestId(testIds.userForms.screen).should('exist');
    cy.visit('/user/forms/00000000-0000-4000-8000-000000000000');
    cy.getByTestId(testIds.fill.notFound).should('exist');
  });

  it('has to do and submitted tabs', () => {
    cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
    cy.getByTestId(testIds.userForms.tabSubmitted).click();
    cy.get(`[data-testid="${testIds.userForms.list}"], [data-testid="${testIds.userForms.empty}"]`).should('exist');
    cy.getByTestId(testIds.userForms.tabTodo).click();
    cy.get(`[data-testid="${testIds.userForms.list}"], [data-testid="${testIds.userForms.empty}"]`).should('exist');
  });
});
