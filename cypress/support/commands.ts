import { testIds } from '../../src/constants/testIds';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Selects an element by its testID (React Native Web renders it as data-testid). */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      /** Signs in through the login screen. Credentials come from cypress.env.json. */
      login(email: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('getByTestId', (testId: string) => cy.get(`[data-testid="${testId}"]`));

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.getByTestId(testIds.login.emailInput).type(email);
  cy.getByTestId(testIds.login.passwordInput).type(password, { log: false });
  cy.getByTestId(testIds.login.submitButton).click();
});

export {};
