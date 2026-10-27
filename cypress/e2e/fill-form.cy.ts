import en from '../../src/i18n/locales/en.json';
import { testIdFor, testIds } from '../../src/constants/testIds';
import {
  addQuestion,
  addQuestionToSection,
  assignOpenFormTo,
  createForm,
  lastQuestionId,
  publishOpenForm,
} from '../support/formFlows';

// Needs the admin and user accounts from cypress.env.json.

function signOut(tab: string): void {
  cy.getByTestId(tab).click();
  cy.getByTestId(testIds.profile.logoutButton).click();
  cy.getByTestId(testIds.login.screen).should('exist');
}

/** Opens the assigned form with this title from the user's list. */
function openForm(title: string): void {
  cy.contains('[data-testid^="assignment-card-"]', title).click();
  cy.getByTestId(testIds.fill.screen).should('exist');
}

interface BuiltForm {
  title: string;
  /** Question ids by purpose. */
  ids: { name: string; choice: string };
}

/**
 * Builds, publishes and assigns (to the user) a form with a required short answer and a multiple choice
 * question, then signs the admin out. Optional steps run between creating the questions and publishing.
 */
function buildForm(extra?: () => void): Cypress.Chainable<BuiltForm> {
  return createForm().then((title) => {
    addQuestion('short_answer');
    return lastQuestionId().then((nameId) => {
      cy.getByTestId(testIdFor.questionTitleInput(nameId)).clear().type('Your name');
      cy.getByTestId(testIdFor.questionRequiredSwitch(nameId)).click();

      addQuestion('multiple_choice');
      return lastQuestionId().then((choiceId) => {
        cy.getByTestId(testIdFor.questionTitleInput(choiceId)).clear().type('Pick one');
        extra?.();
        cy.getByTestId(testIds.editor.saveIndicator).should('contain.text', en.editor.saved);
        publishOpenForm();
        assignOpenFormTo('userEmail');
        signOut(testIds.tabs.adminProfile);
        cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
        return cy.wrap({ title, ids: { name: nameId, choice: choiceId } });
      });
    });
  });
}

describe('Filling in a form', () => {
  it('shows required and validation errors, then submits and confirms', () => {
    buildForm().then(({ title, ids }) => {
      openForm(title);

      cy.getByTestId(testIds.fill.submitButton).click();
      cy.getByTestId(testIdFor.questionError(ids.name)).should('contain.text', en.fill.required);

      cy.getByTestId(testIdFor.questionInput(ids.name)).type('Ann');
      cy.getByTestId(testIdFor.questionError(ids.name)).should('not.exist');

      cy.getByTestId(testIds.fill.submitButton).click();
      cy.getByTestId(`${testIds.fill.confirmDialog}-confirm`).click();

      cy.getByTestId(testIds.done.screen).should('exist');
      cy.getByTestId(testIds.done.message).should('contain.text', en.done.defaultMessage);
    });
  });

  it('keeps the draft after a reload', () => {
    buildForm().then(({ title, ids }) => {
      openForm(title);
      cy.getByTestId(testIdFor.questionInput(ids.name)).type('Draft answer');
      cy.getByTestId(testIds.fill.saveIndicator).should('contain.text', en.fill.saved);

      cy.reload();

      cy.getByTestId(testIdFor.questionInput(ids.name)).should('have.value', 'Draft answer');
    });
  });

  it('shows the submitted form in the submitted tab and cannot be submitted twice', () => {
    buildForm().then(({ title, ids }) => {
      openForm(title);
      cy.getByTestId(testIdFor.questionInput(ids.name)).type('Ann');
      cy.getByTestId(testIds.fill.submitButton).click();
      cy.getByTestId(`${testIds.fill.confirmDialog}-confirm`).click();
      cy.getByTestId(testIds.done.screen).should('exist');

      cy.getByTestId(testIds.done.backButton).click();
      cy.getByTestId(testIds.userForms.tabSubmitted).click();
      cy.getByTestId(testIds.userForms.list).should('contain.text', title);

      cy.contains('[data-testid^="assignment-card-"]', title).click();
      cy.getByTestId(testIds.done.screen).should('exist');
      cy.getByTestId(testIds.fill.submitButton).should('not.exist');
    });
  });

  it('does not offer editing after submitting by default', () => {
    buildForm().then(({ title, ids }) => {
      openForm(title);
      cy.getByTestId(testIdFor.questionInput(ids.name)).type('Ann');
      cy.getByTestId(testIds.fill.submitButton).click();
      cy.getByTestId(`${testIds.fill.confirmDialog}-confirm`).click();
      cy.getByTestId(testIds.done.screen).should('exist');
      cy.getByTestId(testIds.done.editButton).should('not.exist');
    });
  });
  /** Changes a setting of the open form and returns to the editor. */
  function changeSetting(settingTestId: string): void {
    cy.getByTestId(testIds.editorActions.settings).click();
    cy.getByTestId(settingTestId).click();
    cy.getByTestId(testIds.editor.saveIndicator).should('contain.text', en.editor.saved);
    cy.getByTestId(testIds.settings.backButton).click();
    cy.getByTestId(testIds.editor.screen).should('exist');
  }

  it('lets the user edit a submitted response when the form allows it', () => {
    buildForm(() => changeSetting(testIds.settings.allowEditAfterSubmit)).then(({ title, ids }) => {
      openForm(title);
      cy.getByTestId(testIdFor.questionInput(ids.name)).type('Ann');
      cy.getByTestId(testIds.fill.submitButton).click();
      cy.getByTestId(`${testIds.fill.confirmDialog}-confirm`).click();
      cy.getByTestId(testIds.done.editButton).click();
      cy.getByTestId(testIdFor.questionInput(ids.name)).should('have.value', 'Ann').clear().type('Anna');
      cy.getByTestId(testIds.fill.submitButton).click();
      cy.getByTestId(`${testIds.fill.confirmDialog}-confirm`).click();
      cy.getByTestId(testIds.done.screen).should('exist');
    });
  });

  it('shows a closed form as closed', () => {
    buildForm(() => changeSetting(testIds.settings.isAcceptingResponses)).then(({ title }) => {
      cy.contains('[data-testid^="assignment-card-"]', title).click();
      cy.getByTestId(testIds.fill.closed).should('exist');
    });
  });
});

describe('Branching', () => {
  it('skips a section based on the answer', () => {
    createForm().then((title) => {
      cy.getByTestId(testIds.editor.addSectionButton).click();
      cy.getByTestId(testIds.editor.addSectionButton).click();

      // section 1: a choice whose second option jumps to section 3
      addQuestionToSection(0, 'multiple_choice');
      lastQuestionId().then((choiceId) => {
        cy.getByTestId(testIdFor.setting(choiceId, 'branching')).click();
        addQuestionToSection(1, 'short_answer');
        lastQuestionId().then((skippedId) => {
          addQuestionToSection(2, 'short_answer');
          lastQuestionId().then((reachedId) => {
            // jump targets: continue, section 2, section 3, submit
            cy.get(`[data-testid^="question-${choiceId}-option-"][data-testid$="-jump"]`).eq(1).click();
            cy.get(`[data-testid^="question-${choiceId}-option-"][data-testid*="-jump-option-"]`).eq(2).click();

            cy.getByTestId(testIds.editor.saveIndicator).should('contain.text', en.editor.saved);
            publishOpenForm();
            assignOpenFormTo('userEmail');
            signOut(testIds.tabs.adminProfile);

            cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
            openForm(title);
            cy.get(`[data-testid^="question-${choiceId}-option-"]`).eq(1).click();
            cy.getByTestId(testIds.fill.nextButton).click();

            cy.getByTestId(testIdFor.questionInput(reachedId)).should('exist');
            cy.getByTestId(testIdFor.questionInput(skippedId)).should('not.exist');
            cy.getByTestId(testIds.fill.backButton).click();
            cy.get(`[data-testid^="question-${choiceId}-option-"]`).eq(0).click();
            cy.getByTestId(testIds.fill.nextButton).click();
            cy.getByTestId(testIdFor.questionInput(skippedId)).should('exist');
          });
        });
      });
    });
  });
});

describe('Forms that are not available', () => {
  it('shows a not-found state for a form that is not assigned', () => {
    cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
    cy.getByTestId(testIds.userForms.screen).should('exist');
    cy.visit('/user/forms/00000000-0000-4000-8000-000000000000');
    cy.getByTestId(testIds.fill.notFound).should('exist');
    cy.getByTestId(testIds.fill.backToFormsButton).click();
    cy.getByTestId(testIds.userForms.screen).should('exist');
  });
});

describe('Previewing a form', () => {
  it('lets the admin walk through a form without saving', () => {
    createForm().then(() => {
      addQuestion('short_answer');
      lastQuestionId().then((questionId) => {
        cy.getByTestId(testIdFor.questionRequiredSwitch(questionId)).click();
        cy.getByTestId(testIds.editor.saveIndicator).should('contain.text', en.editor.saved);

        cy.getByTestId(testIds.editorActions.preview).click();
        cy.getByTestId(testIds.fill.previewBanner).should('exist');
        cy.getByTestId(testIds.fill.submitButton).click();
        cy.getByTestId(testIdFor.questionError(questionId)).should('exist');

        cy.getByTestId(testIdFor.questionInput(questionId)).type('anything');
        cy.getByTestId(testIds.fill.submitButton).click();
        cy.getByTestId(testIds.fill.previewEnd).should('exist');

        cy.getByTestId(testIds.fill.previewCloseButton).click();
        cy.getByTestId(testIds.editor.screen).should('exist');
      });
    });
  });
});
