describe('QR Service Flow E2E', () => {
  beforeEach(() => {
    // Test as anonymous guest (no auth required for QR portal)
    cy.visit('/qr/test-qr-token')
  })

  it('should complete housekeeping request flow', () => {
    // Verify QR portal loads
    cy.get('[data-cy="qr-portal-title"]').should('be.visible')
    cy.get('[data-cy="room-info"]').should('contain', 'Room')
    
    // Select housekeeping service
    cy.get('[data-cy="service-housekeeping"]').click()
    
    // Fill request details
    cy.get('[data-cy="service-type-select"]').select('cleaning')
    cy.get('[data-cy="special-requests"]').type('Extra towels and toiletries please')
    cy.get('[data-cy="priority-select"]').select('normal')
    
    // Submit request
    cy.get('[data-cy="submit-request"]').click()
    
    // Verify success message
    cy.get('[data-cy="success-message"]').should('be.visible')
    cy.get('[data-cy="tracking-number"]').should('be.visible')
    
    // Check tracking
    cy.get('[data-cy="track-request"]').click()
    cy.get('[data-cy="request-status"]').should('contain', 'Pending')
  })

  it('should complete room service order flow', () => {
    cy.get('[data-cy="service-room-service"]').click()
    
    // Browse menu
    cy.get('[data-cy="menu-category"]').first().click()
    
    // Add items to order
    cy.get('[data-cy="menu-item"]').first().within(() => {
      cy.get('[data-cy="add-to-cart"]').click()
    })
    
    // Increase quantity
    cy.get('[data-cy="item-quantity-plus"]').click()
    
    // Add special instructions
    cy.get('[data-cy="order-notes"]').type('No onions, extra sauce')
    
    // Place order
    cy.get('[data-cy="place-order"]').click()
    
    // Verify order confirmation
    cy.get('[data-cy="order-confirmation"]').should('be.visible')
    cy.get('[data-cy="estimated-time"]').should('be.visible')
  })

  it('should complete maintenance request flow', () => {
    cy.get('[data-cy="service-maintenance"]').click()
    
    // Select issue type
    cy.get('[data-cy="issue-category"]').select('electrical')
    
    // Describe issue
    cy.get('[data-cy="issue-description"]').type('Light fixture not working in bathroom')
    cy.get('[data-cy="issue-priority"]').select('high')
    
    // Submit maintenance request
    cy.get('[data-cy="submit-maintenance"]').click()
    
    // Verify work order created
    cy.get('[data-cy="work-order-number"]').should('be.visible')
    cy.get('[data-cy="estimated-response"]').should('be.visible')
  })

  it('should handle invalid QR token', () => {
    cy.visit('/qr/invalid-token')
    
    // Verify error message
    cy.get('[data-cy="qr-error"]').should('be.visible')
    cy.get('[data-cy="error-message"]').should('contain', 'Invalid QR code')
  })
})
