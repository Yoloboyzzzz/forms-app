import { testIdFor, testIds } from '../../src/constants/testIds';

/** Reusable UI flows for the form specs. They use testIDs only. */

export function loginAsAdmin(): void {
  cy.login(Cypress.env('adminEmail'), Cypress.env('adminPassword'));
  cy.getByTestId(testIds.adminForms.screen).should('exist');
}

/** Creates a draft through the UI and leaves its editor open. Returns the unique title. */
export function createForm(): Cypress.Chainable<string> {
  const title = `E2E form ${Date.now()}`;
  loginAsAdmin();
  cy.getByTestId(testIds.adminForms.newButton).click();
  cy.getByTestId(testIds.newForm.titleInput).type(title);
  cy.getByTestId(testIds.newForm.submitButton).click();
  cy.getByTestId(testIds.editor.screen).should('exist');
  return cy.wrap(title);
}

/** Adds a question of the given type to the first section of the open editor. */
export function addQuestion(type: string): void {
  cy.get('[data-testid^="form-editor-add-question-"]').first().click();
  cy.getByTestId(testIdFor.questionTypeOption(type)).click();
}

/** The id of the last question card in the open editor. */
export function lastQuestionId(): Cypress.Chainable<string> {
  return cy
    .get('[data-testid^="question-"][data-testid$="-title-input"]')
    .last()
    .invoke('attr', 'data-testid')
    .then((testId) => (testId ?? '').replace(/^question-/, '').replace(/-title-input$/, ''));
}

/** Publishes the form in the open editor. */
export function publishOpenForm(): void {
  cy.getByTestId(testIds.editorActions.publish).click();
  cy.getByTestId(`${testIds.editorActions.confirmDialog}-confirm`).click();
  cy.getByTestId(testIds.editorActions.publish).should('not.exist');
}

/** Assigns the open form to the account whose email is stored under `emailKey` in cypress.env.json. */
export function assignOpenFormTo(emailKey: 'userEmail' | 'user2Email'): void {
  cy.getByTestId(testIds.editorActions.assign).click();
  cy.getByTestId(testIds.assign.screen).should('exist');
  cy.getByTestId(testIds.assign.searchInput).type(Cypress.env(emailKey));
  cy.contains('[data-testid^="assign-candidate-"]', Cypress.env(emailKey)).click();
  cy.getByTestId(testIds.assign.submitButton).click();
  cy.getByTestId(testIds.assign.assigneeList).should('contain.text', Cypress.env(emailKey));
}

/** Creates, fills (one short answer question), publishes and assigns a form. Returns its title. */
export function createPublishedFormFor(emailKey: 'userEmail' | 'user2Email'): Cypress.Chainable<string> {
  return createForm().then((title) => {
    addQuestion('short_answer');
    cy.getByTestId(testIds.editor.saveIndicator).should('exist');
    publishOpenForm();
    assignOpenFormTo(emailKey);
    return cy.wrap(title);
  });
}
