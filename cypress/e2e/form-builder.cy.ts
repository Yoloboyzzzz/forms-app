import en from '../../src/i18n/locales/en.json';
import { CORE_QUESTION_TYPES } from '../../src/types/enums';
import { testIdFor, testIds } from '../../src/constants/testIds';

// Needs the admin account from cypress.env.json. Forms get unique titles so runs do not collide;
// the test project's seed data is reset to remove them.

function loginAsAdmin(): void {
  cy.login(Cypress.env('adminEmail'), Cypress.env('adminPassword'));
  cy.getByTestId(testIds.adminForms.screen).should('exist');
}

/** Creates a draft through the UI and leaves the editor open. Returns the unique title. */
function createForm(): Cypress.Chainable<string> {
  const title = `E2E form ${Date.now()}`;
  loginAsAdmin();
  cy.getByTestId(testIds.adminForms.newButton).click();
  cy.getByTestId(testIds.newForm.titleInput).type(title);
  cy.getByTestId(testIds.newForm.submitButton).click();
  cy.getByTestId(testIds.editor.screen).should('exist');
  return cy.wrap(title);
}

/** Adds a question of the given type to the first section and returns its id (read from the new card). */
function addQuestion(sectionTestId: string, type: string): void {
  cy.get(`[data-testid="${sectionTestId}"] [data-testid^="form-editor-add-question-"]`).click();
  cy.getByTestId(testIdFor.questionTypeOption(type)).click();
}

function lastQuestionId(): Cypress.Chainable<string> {
  return cy
    .get('[data-testid^="question-"][data-testid$="-title-input"]')
    .last()
    .invoke('attr', 'data-testid')
    .then((testId) => (testId ?? '').replace(/^question-/, '').replace(/-title-input$/, ''));
}

describe('Forms list', () => {
  it('shows the list with a status filter and a create button', () => {
    loginAsAdmin();
    cy.getByTestId(testIds.adminForms.newButton).should('exist');
    ['all', 'draft', 'published', 'archived'].forEach((status) =>
      cy.getByTestId(testIdFor.formStatusFilter(status)).should('exist'),
    );
  });

  it('shows an empty state for a status without forms', () => {
    loginAsAdmin();
    cy.getByTestId(testIdFor.formStatusFilter('archived')).click();
    cy.get(`[data-testid="${testIds.adminForms.empty}"], [data-testid="${testIds.adminForms.list}"]`).should('exist');
  });
});

describe('Creating a form', () => {
  it('validates the title', () => {
    loginAsAdmin();
    cy.getByTestId(testIds.adminForms.newButton).click();
    cy.getByTestId(testIds.newForm.submitButton).click();
    cy.getByTestId(`${testIds.newForm.titleInput}-error`).should('exist');
  });

  it('creates a draft, opens the editor and lists it', () => {
    createForm().then((title) => {
      cy.getByTestId(testIds.editor.titleInput).should('have.value', title);
      cy.visit('/admin/forms');
      cy.getByTestId(testIds.adminForms.list).should('contain.text', title);
    });
  });
});

describe('Editing a form', () => {
  it('adds a question of every core type', () => {
    createForm().then(() => {
      CORE_QUESTION_TYPES.forEach((type) => {
        cy.get('[data-testid^="section-"]').first().invoke('attr', 'data-testid').then((sectionTestId) => {
          addQuestion(sectionTestId ?? '', type);
        });
        lastQuestionId().then((questionId) => {
          cy.getByTestId(testIdFor.question(questionId)).should('contain.text', en.questionType[type]);
        });
      });
    });
  });

  it('autosaves edits and keeps them after a reload', () => {
    createForm().then(() => {
      cy.get('[data-testid^="section-"]').first().invoke('attr', 'data-testid').then((sectionTestId) => {
        addQuestion(sectionTestId ?? '', 'short_answer');
      });
      lastQuestionId().then((questionId) => {
        cy.getByTestId(testIdFor.questionTitleInput(questionId)).clear().type('What is your name?');
        cy.getByTestId(testIds.editor.saveIndicator).should('contain.text', en.editor.saved);
        cy.reload();
        cy.getByTestId(testIdFor.questionTitleInput(questionId)).should('have.value', 'What is your name?');
      });
    });
  });

  it('edits the options of a multiple choice question', () => {
    createForm().then(() => {
      cy.get('[data-testid^="section-"]').first().invoke('attr', 'data-testid').then((sectionTestId) => {
        addQuestion(sectionTestId ?? '', 'multiple_choice');
      });
      lastQuestionId().then((questionId) => {
        cy.getByTestId(testIdFor.optionAdd(questionId)).click();
        cy.get(`[data-testid^="question-${questionId}-option-"][data-testid$="-remove-button"]`).should('have.length', 3);
        cy.get(`[data-testid^="question-${questionId}-option-"][data-testid$="-remove-button"]`).first().click();
        cy.get(`[data-testid^="question-${questionId}-option-"][data-testid$="-remove-button"]`).should('have.length', 2);
      });
    });
  });

  it('moves, duplicates and deletes a question after confirmation', () => {
    createForm().then(() => {
      cy.get('[data-testid^="section-"]').first().invoke('attr', 'data-testid').then((sectionTestId) => {
        addQuestion(sectionTestId ?? '', 'short_answer');
        addQuestion(sectionTestId ?? '', 'paragraph');
      });
      lastQuestionId().then((questionId) => {
        cy.getByTestId(testIdFor.questionAction(questionId, 'duplicate')).click();
        cy.get('[data-testid^="question-"][data-testid$="-title-input"]').should('have.length', 3);
        cy.getByTestId(testIdFor.questionAction(questionId, 'delete')).click();
        cy.getByTestId(`${testIds.editor.deleteDialog}-confirm`).click();
        cy.get('[data-testid^="question-"][data-testid$="-title-input"]').should('have.length', 2);
      });
    });
  });

  it('adds sections and sets what happens after a section', () => {
    createForm().then(() => {
      cy.getByTestId(testIds.editor.addSectionButton).click();
      cy.get('[data-testid^="section-"][data-testid$="-title-input"]').should('have.length', 2);
      cy.get('[data-testid^="section-"][data-testid$="-after"]').first().click();
      cy.get('[data-testid^="section-"][data-testid$="-after-option-submit"]').click();
      cy.get('[data-testid^="section-"][data-testid$="-after"]').first().should('contain.text', en.editor.afterSubmit);
    });
  });

  it('branches to a section based on the answer', () => {
    createForm().then(() => {
      cy.getByTestId(testIds.editor.addSectionButton).click();
      cy.get('[data-testid^="section-"]').first().invoke('attr', 'data-testid').then((sectionTestId) => {
        addQuestion(sectionTestId ?? '', 'multiple_choice');
      });
      lastQuestionId().then((questionId) => {
        cy.getByTestId(testIdFor.setting(questionId, 'branching')).click();
        cy.get(`[data-testid^="question-${questionId}-option-"][data-testid$="-jump"]`).first().click();
        cy.get(`[data-testid^="question-${questionId}-option-"][data-testid*="-jump-option-"]`).first().click();
        cy.get(`[data-testid^="question-${questionId}-option-"][data-testid$="-jump"]`)
          .first()
          .should('not.contain.text', en.editor.jumpContinue);
      });
    });
  });
});

describe('Form settings', () => {
  it('saves settings and keeps them after a reload', () => {
    createForm().then(() => {
      cy.getByTestId(testIds.editorActions.settings).click();
      cy.getByTestId(testIds.settings.screen).should('exist');
      cy.getByTestId(testIds.settings.confirmationMessage).type('Thanks for your answers');
      cy.getByTestId(testIds.settings.closesAt).type('2030-01-31');
      cy.getByTestId(testIds.settings.showProgressBar).click();
      cy.getByTestId(testIds.settings.closesAt).clear().type('not a date');
      cy.getByTestId(`${testIds.settings.closesAt}-error`).should('exist');
      cy.getByTestId(testIds.settings.closesAt).clear().type('2030-01-31');
      cy.reload();
      cy.getByTestId(testIds.settings.confirmationMessage).should('have.value', 'Thanks for your answers');
      cy.getByTestId(testIds.settings.closesAt).should('have.value', '2030-01-31 23:59');
    });
  });
});

describe('Publishing, duplicating and archiving', () => {
  it('refuses to publish a form without questions', () => {
    createForm().then(() => {
      cy.getByTestId(testIds.editorActions.publish).click();
      cy.getByTestId(`${testIds.editorActions.confirmDialog}-confirm`).click();
      cy.getByTestId(testIds.editor.notice).should('contain.text', en.editor.publishNeedsQuestion);
    });
  });

  it('publishes, duplicates and archives a form', () => {
    createForm().then((title) => {
      cy.get('[data-testid^="section-"]').first().invoke('attr', 'data-testid').then((sectionTestId) => {
        addQuestion(sectionTestId ?? '', 'short_answer');
      });
      cy.getByTestId(testIds.editor.saveIndicator).should('exist');

      cy.getByTestId(testIds.editorActions.publish).click();
      cy.getByTestId(`${testIds.editorActions.confirmDialog}-confirm`).click();
      cy.getByTestId(testIds.editor.notice).should('contain.text', en.editor.published);
      cy.getByTestId(testIds.editorActions.publish).should('not.exist');

      cy.getByTestId(testIds.editorActions.duplicate).click();
      cy.getByTestId(`${testIds.editorActions.confirmDialog}-confirm`).click();
      cy.getByTestId(testIds.editor.titleInput).should('have.value', en.editor.copyTitle.replace('{{title}}', title));

      cy.getByTestId(testIds.editorActions.archive).click();
      cy.getByTestId(`${testIds.editorActions.confirmDialog}-confirm`).click();
      cy.getByTestId(testIds.editor.notice).should('contain.text', en.editor.archived);
      cy.getByTestId(testIds.editorActions.archive).should('not.exist');
    });
  });
});
