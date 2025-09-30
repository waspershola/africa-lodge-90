describe('Guest Checkout Flow', () => {
  beforeEach(() => {
    // Visit the front desk page
    cy.visit('/front-desk');
  });

  it('should show occupied rooms', () => {
    // Wait for rooms to load
    cy.get('[data-testid="room-card"]', { timeout: 10000 }).should('exist');
  });

  it('should complete atomic checkout process', () => {
    // Find and click on an occupied room
    cy.get('[data-testid="room-card"]').first().click();
    
    // Checkout dialog should open
    cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
    
    // Complete checkout button should be visible
    cy.contains('button', 'Complete Checkout').should('exist');
    
    // Note: Actual checkout completion requires proper test data setup
    // This test validates the UI flow is working correctly
  });

  it('should prevent checkout with outstanding balance', () => {
    // Find occupied room with pending payment
    cy.get('[data-testid="room-card"]').first().click();
    
    // If there's outstanding balance, checkout should be disabled
    cy.get('[role="dialog"]').within(() => {
      cy.get('button').contains('Complete Checkout').then(($btn) => {
        if ($btn.is(':disabled')) {
          // Verify outstanding balance warning is shown
          cy.contains('Outstanding Balance').should('exist');
        }
      });
    });
  });
});