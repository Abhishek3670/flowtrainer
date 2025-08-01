// Import Cypress commands
import './commands';

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  cy.stub(win.console, 'error').callsFake((msg) => {
    // Hide expected errors from console
    if (typeof msg === 'string' && msg.includes('Warning:')) {
      return;
    }
    // Log all other errors
    Cypress.log({
      name: 'console.error',
      message: msg,
    });
  });
});
