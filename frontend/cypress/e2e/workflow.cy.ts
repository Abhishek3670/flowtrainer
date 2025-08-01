describe('FlowCraft Workflow Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the main interface', () => {
    cy.contains('FlowCraft').should('be.visible');
    cy.contains('Welcome to FlowCraft').should('be.visible');
  });

  it('should show node toolbox', () => {
    cy.contains('Start Node').should('be.visible');
    cy.contains('HTTP Call').should('be.visible');
    cy.contains('Delay').should('be.visible');
    cy.contains('Condition').should('be.visible');
    cy.contains('Loop').should('be.visible');
  });

  it('should have toolbar buttons', () => {
    cy.contains('Save').should('be.visible');
    cy.contains('Run').should('be.visible');
  });

  it('should show properties panel', () => {
    cy.contains('Properties').should('be.visible');
    cy.contains('Select a node to edit its properties').should('be.visible');
  });
});
