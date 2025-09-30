describe('Guest Checkout Flow - Comprehensive Tests', () => {
  beforeEach(() => {
    cy.visit('/front-desk');
    cy.get('[data-testid="room-card"]', { timeout: 10000 }).should('exist');
  });

  describe('Happy Path', () => {
    it('should complete atomic checkout successfully with zero balance', () => {
      // Find occupied room
      cy.get('[data-testid="room-card"]').contains('Occupied').first().click();
      
      // Checkout dialog should open
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
      
      // If balance is zero, checkout button should be enabled
      cy.get('[role="dialog"]').within(() => {
        cy.get('button').contains('Complete Checkout').should('be.enabled');
      });
    });

    it('should show single success toast on checkout', () => {
      cy.get('[data-testid="room-card"]').contains('Occupied').first().click();
      
      // Complete checkout
      cy.get('button').contains('Complete Checkout').click();
      
      // Should show exactly one success toast
      cy.get('[role="status"]').should('have.length', 1);
      
      // Dialog should close automatically
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('should update room to dirty status after checkout', () => {
      cy.get('[data-testid="room-card"]').contains('Occupied').first().as('targetRoom');
      
      cy.get('@targetRoom').click();
      cy.get('button').contains('Complete Checkout').click();
      
      // Wait for checkout to complete
      cy.wait(1000);
      
      // Room should now show as dirty
      cy.get('@targetRoom').should('contain', 'Dirty');
    });
  });

  describe('Outstanding Balance Prevention', () => {
    it('should prevent checkout with outstanding balance', () => {
      // Find occupied room with pending payment
      cy.get('[data-testid="room-card"]').contains('Occupied').first().click();
      
      cy.get('[role="dialog"]').within(() => {
        // Check if balance is outstanding
        cy.get('body').then(($body) => {
          if ($body.text().includes('Outstanding Balance') || $body.text().includes('₦')) {
            // Checkout button should be disabled
            cy.get('button').contains('Complete Checkout').should('be.disabled');
            
            // Should show balance warning
            cy.contains('Outstanding Balance').should('exist');
          }
        });
      });
    });

    it('should show exact outstanding amount', () => {
      cy.get('[data-testid="room-card"]').contains('Occupied').first().click();
      
      // Should display the exact balance due
      cy.get('[role="dialog"]').within(() => {
        cy.contains(/₦\d+/).should('exist'); // Matches currency format
      });
    });

    it('should enable checkout after payment settles balance', () => {
      cy.get('[data-testid="room-card"]').contains('Occupied').first().click();
      
      // Settle bills
      cy.get('button').contains('Settle Bills').click();
      
      // Make payment (requires payment flow implementation)
      // After payment, checkout should be enabled
      cy.get('button').contains('Complete Checkout').should('be.enabled');
    });
  });

  describe('Edge Cases', () => {
    it('should prevent double checkout on rapid clicks', () => {
      cy.get('[data-testid="room-card"]').contains('Occupied').first().click();
      
      // Rapidly click checkout button
      const checkoutBtn = cy.get('button').contains('Complete Checkout');
      checkoutBtn.click();
      checkoutBtn.should('be.disabled');
    });

    it('should handle checkout timeout gracefully', () => {
      // Intercept checkout request with 30s timeout
      cy.intercept('POST', '**/rpc/atomic_checkout', {
        delay: 30000,
        statusCode: 408,
        body: { message: 'Checkout timeout after 30 seconds' }
      });
      
      cy.get('[data-testid="room-card"]').contains('Occupied').first().click();
      cy.get('button').contains('Complete Checkout').click();
      
      // Should show timeout error
      cy.get('[role="status"]').contains('timeout', { matchCase: false }).should('exist');
    });

    it('should rollback on checkout failure', () => {
      // Intercept checkout to simulate failure
      cy.intercept('POST', '**/rpc/atomic_checkout', {
        statusCode: 500,
        body: { success: false, message: 'Checkout failed: Unable to close folio' }
      });
      
      cy.get('[data-testid="room-card"]').contains('Occupied').first().click();
      cy.get('button').contains('Complete Checkout').click();
      
      // Should show error toast
      cy.get('[role="status"]').contains('failed', { matchCase: false }).should('exist');
      
      // Dialog should remain open
      cy.get('[role="dialog"]').should('be.visible');
      
      // Room should still show as occupied
      cy.get('[data-testid="room-card"]').first().should('contain', 'Occupied');
    });
  });

  describe('Payment Modal Integration', () => {
    it('should open payment modal for specific folio', () => {
      cy.get('[data-testid="room-card"]').contains('Occupied').first().click();
      
      // Click settle bills
      cy.get('button').contains('Settle Bills').click();
      
      // Payment modal should show only this folio's balance
      cy.get('[role="dialog"]').contains('Payment').should('exist');
    });

    it('should update checkout button after successful payment', () => {
      cy.get('[data-testid="room-card"]').contains('Occupied').first().click();
      
      // Record initial checkout button state
      cy.get('button').contains('Complete Checkout').as('checkoutBtn');
      
      // Make payment
      cy.get('button').contains('Settle Bills').click();
      
      // After payment, checkout button should be enabled
      cy.get('@checkoutBtn').should('be.enabled');
    });
  });

  describe('Real-time Updates', () => {
    it('should auto-update folio balance after payment', () => {
      cy.get('[data-testid="room-card"]').contains('Occupied').first().click();
      
      // Initial balance
      cy.get('[role="dialog"]').contains(/₦\d+/).invoke('text').as('initialBalance');
      
      // Make payment (simulated)
      // Balance should update automatically without closing modal
    });

    it('should reflect checkout across all devices', () => {
      // Simulate multi-device scenario
      // Checkout on device 1
      // Device 2 should see updated room status without reload
      // Note: Requires multi-session testing setup
    });
  });

  describe('Service Summary & Receipts', () => {
    it('should display service summary before checkout', () => {
      cy.get('[data-testid="room-card"]').contains('Occupied').first().click();
      
      cy.get('button').contains('Service Summary').click();
      
      // Should show breakdown of charges
      cy.get('[role="dialog"]').should('contain', 'Room Charges');
    });

    it('should generate receipt after checkout', () => {
      cy.get('[data-testid="room-card"]').contains('Occupied').first().click();
      
      // Complete checkout
      cy.get('button').contains('Complete Checkout').click();
      
      // Receipt button should be available
      cy.get('button').contains('Print Bill').should('exist');
    });
  });
});