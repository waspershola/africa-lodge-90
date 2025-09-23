describe('Guest Checkout Flow', () => {
  it('should complete checkout process', () => {
    cy.visit('/front-desk');
    cy.get('[data-cy="room-occupied"]').first().click();
    cy.get('[data-cy="checkout-button"]').click();
    cy.get('[data-cy="checkout-dialog"]').should('be.visible');
    cy.get('[data-cy="complete-checkout-button"]').click();
    cy.get('[data-cy="checkout-success"]').should('be.visible');
  });
});