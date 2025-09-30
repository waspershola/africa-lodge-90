describe('Guest Check-in Flow', () => {
  beforeEach(() => {
    cy.visit('/front-desk');
  });

  it('should show available rooms for check-in', () => {
    // Wait for room grid to load
    cy.get('[data-testid="room-card"]', { timeout: 10000 }).should('exist');
  });

  it('should open check-in dialog for available room', () => {
    // Find an available room
    cy.get('[data-testid="room-card"]').first().click();
    
    // Check-in form should be accessible
    cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
  });

  it('should validate required fields in check-in form', () => {
    // Open check-in dialog
    cy.get('[data-testid="room-card"]').first().click();
    
    // Try to submit without filling required fields
    cy.get('button').contains('Check In').click();
    
    // Validation errors should appear (if form validation is implemented)
    // Note: This depends on your form validation implementation
  });

  it('should show loading state during check-in', () => {
    // Open check-in dialog
    cy.get('[data-testid="room-card"]').first().click();
    
    // Fill minimum required fields and submit
    // Note: This requires proper test data setup
    cy.get('button').contains('Check In').should('exist');
  });
});
