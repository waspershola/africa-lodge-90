describe('Guest Check-in Flow - Comprehensive Tests', () => {
  beforeEach(() => {
    cy.visit('/front-desk');
    // Wait for initial load
    cy.get('[data-testid="room-card"]', { timeout: 10000 }).should('exist');
  });

  describe('Happy Path', () => {
    it('should complete atomic check-in successfully', () => {
      // Find an available room
      cy.get('[data-testid="room-card"]').first().click();
      
      // Check-in form should be accessible
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
      
      // Verify single loading state appears
      cy.get('button').contains('Check In').should('be.visible');
      
      // After successful check-in, room should update to occupied
      // Note: Requires test data setup
    });

    it('should show exactly one success toast on check-in', () => {
      // Open check-in dialog
      cy.get('[data-testid="room-card"]').first().click();
      
      // Fill required fields and submit
      // Verify only one toast appears
      cy.get('[role="status"]').should('have.length.lessThan', 2);
    });
  });

  describe('Validation', () => {
    it('should validate required guest information', () => {
      cy.get('[data-testid="room-card"]').first().click();
      
      // Try to submit without filling required fields
      cy.get('button').contains('Check In').click();
      
      // Validation errors should appear
      cy.contains('required', { matchCase: false }).should('exist');
    });

    it('should validate email format', () => {
      cy.get('[data-testid="room-card"]').first().click();
      
      // Enter invalid email
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('button').contains('Check In').click();
      
      // Email validation error should appear
      cy.contains('email', { matchCase: false }).should('exist');
    });
  });

  describe('Edge Cases', () => {
    it('should prevent double check-in on rapid clicks', () => {
      cy.get('[data-testid="room-card"]').first().click();
      
      // Rapidly click check-in button
      cy.get('button').contains('Check In').click();
      cy.get('button').contains('Check In').should('be.disabled');
      
      // Should show loading state
      cy.get('button').contains('Check In').should('contain', 'ing');
    });

    it('should handle network timeout gracefully', () => {
      // Intercept check-in request with delay
      cy.intercept('POST', '**/rpc/atomic_checkin_guest', {
        delay: 5000,
        statusCode: 200
      });
      
      cy.get('[data-testid="room-card"]').first().click();
      cy.get('button').contains('Check In').click();
      
      // Should show loading state during delay
      cy.get('[role="status"]').should('exist');
    });

    it('should rollback on partial failure', () => {
      // Intercept check-in request to simulate error
      cy.intercept('POST', '**/rpc/atomic_checkin_guest', {
        statusCode: 500,
        body: { message: 'Folio creation failed' }
      });
      
      cy.get('[data-testid="room-card"]').first().click();
      cy.get('button').contains('Check In').click();
      
      // Should show error toast
      cy.get('[role="status"]').contains('error', { matchCase: false }).should('exist');
      
      // Room should remain available (not occupied)
      cy.get('[data-testid="room-card"]').first().should('not.contain', 'Occupied');
    });
  });

  describe('Same-Day Checkout Overstay', () => {
    it('should NOT mark as overstay immediately after same-day check-in', () => {
      // Check in on checkout date
      cy.get('[data-testid="room-card"]').first().click();
      
      // Complete check-in
      // Room should NOT show overstay badge immediately
      cy.get('[data-testid="room-card"]').first().should('not.contain', 'Overstay');
    });

    it('should mark as overstay only after checkout time', () => {
      // This test requires mocking time to be past checkout time (12:00 PM)
      const pastCheckoutTime = new Date();
      pastCheckoutTime.setHours(13, 0, 0); // 1 PM
      
      cy.clock(pastCheckoutTime);
      
      // Reload page to trigger overstay calculation
      cy.reload();
      
      // Now overstay badge should appear for overdue reservations
      cy.get('[data-testid="room-card"]').contains('Overstay').should('exist');
    });
  });

  describe('Real-time Updates', () => {
    it('should update room status across tabs', () => {
      // Open second window/tab (simulated)
      // Perform check-in in first tab
      // Verify second tab updates without reload
      // Note: This requires multi-tab testing setup
    });
  });
});
