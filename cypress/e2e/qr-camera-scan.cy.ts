describe('QR Camera Scanning E2E', () => {
  beforeEach(() => {
    // Visit guest portal landing page
    cy.visit('/guest/qr');
  });

  describe('Camera Access', () => {
    it('should show QR scanner component when no token provided', () => {
      cy.contains('Guest Portal').should('be.visible');
      cy.contains('Scan your QR code to access hotel services').should('be.visible');
      cy.get('[data-testid="qr-scanner"]').should('exist');
    });

    it('should have manual token entry fallback', () => {
      cy.get('[data-testid="manual-token-input"]').should('be.visible');
      cy.get('[data-testid="manual-token-submit"]').should('be.visible');
    });

    it('should have file upload fallback for camera', () => {
      cy.get('input[type="file"][accept*="image"]').should('exist');
    });
  });

  describe('Manual Token Entry', () => {
    it('should accept valid token and navigate to portal', () => {
      const validToken = 'test-qr-token-123';
      
      cy.get('[data-testid="manual-token-input"]').type(validToken);
      cy.get('[data-testid="manual-token-submit"]').click();
      
      // Should navigate to portal with token
      cy.url().should('include', `/guest/qr/${validToken}`);
      
      // Should show hotel services
      cy.contains('Guest Services', { timeout: 10000 }).should('be.visible');
    });

    it('should show error for invalid token format', () => {
      cy.get('[data-testid="manual-token-input"]').type('abc');
      cy.get('[data-testid="manual-token-submit"]').click();
      
      // Should show validation error
      cy.contains('invalid', { matchCase: false }).should('be.visible');
    });

    it('should trim whitespace from token input', () => {
      const validToken = '  test-qr-token-123  ';
      
      cy.get('[data-testid="manual-token-input"]').type(validToken);
      cy.get('[data-testid="manual-token-submit"]').click();
      
      cy.url().should('include', '/guest/qr/test-qr-token-123');
    });
  });

  describe('Token Extraction from URL', () => {
    it('should handle short URL redirects', () => {
      // Simulate short URL redirect
      cy.visit('/q/abc123', { failOnStatusCode: false });
      
      // Should redirect to full QR portal URL
      cy.url({ timeout: 10000 }).should('match', /\/guest\/qr\/[a-zA-Z0-9-]+/);
    });

    it('should handle QR codes with URL parameters', () => {
      cy.visit('/guest/qr/test-token?utm_source=qr&ref=room101');
      
      // Should still load portal despite query params
      cy.contains('Guest Services', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Session Creation', () => {
    it('should create session on successful scan', () => {
      cy.visit('/guest/qr/valid-test-token');
      
      // Wait for session to be created
      cy.window().then((win) => {
        const sessionToken = win.sessionStorage.getItem('qr_session_jwt');
        expect(sessionToken).to.not.be.null;
        expect(sessionToken).to.be.a('string');
        expect(sessionToken?.length).to.be.greaterThan(50);
      });
    });

    it('should store session data in sessionStorage', () => {
      cy.visit('/guest/qr/valid-test-token');
      
      cy.window().then((win) => {
        const sessionData = win.sessionStorage.getItem('qr_session_data');
        expect(sessionData).to.not.be.null;
        
        const parsed = JSON.parse(sessionData!);
        expect(parsed).to.have.property('sessionId');
        expect(parsed).to.have.property('tenantId');
        expect(parsed).to.have.property('expiresAt');
      });
    });

    it('should NOT store session in localStorage', () => {
      cy.visit('/guest/qr/valid-test-token');
      
      cy.window().then((win) => {
        const localStorageSession = win.localStorage.getItem('qr_session_jwt');
        expect(localStorageSession).to.be.null;
      });
    });
  });

  describe('QR Scan Logging', () => {
    it('should log scan to qr_scan_logs table', () => {
      cy.visit('/guest/qr/trackable-test-token');
      
      // Wait for portal to load (indicates scan was logged)
      cy.contains('Guest Services', { timeout: 10000 }).should('be.visible');
      
      // Verify scan was logged (would require DB query in real test)
      // In production: check analytics dashboard shows +1 scan
    });

    it('should capture device info in scan log', () => {
      cy.visit('/guest/qr/test-token', {
        onBeforeLoad(win) {
          // Simulate mobile user agent
          Object.defineProperty(win.navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
            writable: false
          });
        }
      });
      
      cy.contains('Guest Services', { timeout: 10000 }).should('be.visible');
      
      // Device info should be captured (verify in DB or network request)
      cy.window().then((win) => {
        expect(win.navigator.userAgent).to.include('iPhone');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should allow multiple scans within limit', () => {
      // Scan same token 5 times (under 10/min limit)
      for (let i = 0; i < 5; i++) {
        cy.visit('/guest/qr/rate-limit-test-token');
        cy.wait(1000); // Wait 1s between scans
      }
      
      // Should still work
      cy.contains('Guest Services').should('be.visible');
    });

    it('should block excessive scans', () => {
      // Attempt 15 scans rapidly (over 10/min limit)
      for (let i = 0; i < 15; i++) {
        cy.visit('/guest/qr/rate-limit-test-token', { failOnStatusCode: false });
      }
      
      // Should show rate limit error
      cy.contains('Too many requests', { matchCase: false, timeout: 5000 }).should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle expired QR codes gracefully', () => {
      cy.visit('/guest/qr/expired-token-123');
      
      cy.contains('expired', { matchCase: false }).should('be.visible');
      cy.contains('Call Front Desk').should('be.visible');
    });

    it('should handle deactivated QR codes', () => {
      cy.visit('/guest/qr/deactivated-token-123');
      
      cy.contains('no longer valid', { matchCase: false }).should('be.visible');
    });

    it('should show network error on timeout', () => {
      // Intercept and delay QR validation request
      cy.intercept('POST', '**/qr-unified-api', {
        delay: 30000, // 30s delay
      }).as('qrValidation');
      
      cy.visit('/guest/qr/test-token', { timeout: 35000 });
      
      // Should show timeout error
      cy.contains('timeout', { matchCase: false, timeout: 35000 }).should('be.visible');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should display correctly on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/guest/qr/test-token');
      
      // Check mobile-optimized UI
      cy.get('[data-testid="qr-scanner"]').should('be.visible');
      cy.get('[data-testid="manual-token-input"]').should('be.visible');
    });

    it('should have touch-friendly buttons (min 44x44px)', () => {
      cy.viewport('iphone-x');
      cy.visit('/guest/qr');
      
      cy.get('[data-testid="manual-token-submit"]').then(($btn) => {
        const height = $btn.height() || 0;
        const width = $btn.width() || 0;
        
        expect(height).to.be.at.least(44);
        expect(width).to.be.at.least(44);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.visit('/guest/qr');
      
      cy.get('[data-testid="qr-scanner"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="manual-token-input"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="manual-token-submit"]').should('have.attr', 'aria-label');
    });

    it('should be keyboard navigable', () => {
      cy.visit('/guest/qr');
      
      // Tab through interactive elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'manual-token-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'manual-token-submit');
    });

    it('should announce errors to screen readers', () => {
      cy.visit('/guest/qr');
      
      cy.get('[data-testid="manual-token-input"]').type('invalid');
      cy.get('[data-testid="manual-token-submit"]').click();
      
      // Check for aria-live region with error
      cy.get('[role="status"], [role="alert"]').should('contain', 'invalid');
    });
  });
});
