describe('Login screen', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('renders the login form', () => {
    cy.get('[data-testid="email-input"]').should('exist');
    cy.get('[data-testid="password-input"]').should('exist');
    cy.get('[data-testid="login-button"]').should('exist');
  });

  it('logs in with valid credentials and navigates to home', () => {
    // Replace with your Supabase test credentials before running this test
    const testEmail = 'test@example.com';
    const testPassword = 'password123';

    cy.get('[data-testid="email-input"]').type(testEmail);
    cy.get('[data-testid="password-input"]').type(testPassword);
    cy.get('[data-testid="login-button"]').click();

    cy.url().should('include', '/');
  });
});
