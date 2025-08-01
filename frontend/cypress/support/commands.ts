// Custom Cypress commands for FlowCraft testing

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password },
  }).then((response) => {
    window.localStorage.setItem('token', response.body.token);
  });
});

Cypress.Commands.add('createWorkflow', (title: string, description?: string) => {
  const token = window.localStorage.getItem('token');
  cy.request({
    method: 'POST',
    url: '/api/workflows',
    headers: { Authorization: `Bearer ${token}` },
    body: { title, description },
  });
});

// Declare custom commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createWorkflow(title: string, description?: string): Chainable<void>;
    }
  }
}
