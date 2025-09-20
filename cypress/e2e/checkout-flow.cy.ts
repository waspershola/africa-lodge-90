describe('Checkout Flow E2E', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'test-user', email: 'staff@hotel.com', role: 'FRONT_DESK' },
        session: { access_token: 'mock-token' }
      }))
    })
    cy.visit('/hotel/dashboard')
  })

  it('should complete guest checkout flow', () => {
    // Navigate to front desk
    cy.get('[data-cy="nav-front-desk"]').click()
    
    // Find occupied room
    cy.get('[data-testid="room-tile"]').contains('Occupied').first().click()
    
    // Open checkout dialog
    cy.get('[data-cy="checkout-button"]').click()
    
    // Verify guest information displayed
    cy.get('[data-cy="guest-name"]').should('be.visible')
    cy.get('[data-cy="room-charges"]').should('be.visible')
    
    // Process payment
    cy.get('[data-cy="payment-method-select"]').select('cash')
    cy.get('[data-cy="payment-amount"]').type('15000')
    cy.get('[data-cy="process-payment"]').click()
    
    // Complete checkout
    cy.get('[data-cy="complete-checkout"]').click()
    
    // Verify room status updated
    cy.get('[data-testid="room-tile"]').should('contain', 'Dirty')
    
    // Verify receipt generated
    cy.get('[data-cy="receipt-dialog"]').should('be.visible')
  })

  it('should handle split payments', () => {
    cy.get('[data-testid="room-tile"]').contains('Occupied').first().click()
    cy.get('[data-cy="checkout-button"]').click()
    
    // Add first payment
    cy.get('[data-cy="payment-method-select"]').select('cash')
    cy.get('[data-cy="payment-amount"]').type('10000')
    cy.get('[data-cy="add-payment"]').click()
    
    // Add second payment
    cy.get('[data-cy="payment-method-select"]').select('card')
    cy.get('[data-cy="payment-amount"]').type('5000')
    cy.get('[data-cy="add-payment"]').click()
    
    // Verify balance zero
    cy.get('[data-cy="remaining-balance"]').should('contain', '0.00')
    
    // Complete checkout
    cy.get('[data-cy="complete-checkout"]').click()
  })
})