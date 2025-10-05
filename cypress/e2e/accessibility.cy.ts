describe('Accessibility Compliance E2E', () => {
  describe('Guest QR Portal Accessibility', () => {
    beforeEach(() => {
      cy.visit('/guest/qr/test-accessibility-token');
      cy.contains('Guest Services', { timeout: 10000 }).should('be.visible');
    });

    it('should have proper page title', () => {
      cy.title().should('not.be.empty');
      cy.title().should('include', 'Guest');
    });

    it('should have lang attribute on html', () => {
      cy.get('html').should('have.attr', 'lang', 'en');
    });

    it('should have exactly one h1', () => {
      cy.get('h1').should('have.length', 1);
    });

    it('should have logical heading hierarchy', () => {
      // Check that h2 doesn't appear before h1
      cy.get('h1, h2, h3, h4, h5, h6').then(($headings) => {
        const levels = Array.from($headings).map(h => parseInt(h.tagName.charAt(1)));
        
        for (let i = 1; i < levels.length; i++) {
          const diff = levels[i] - levels[i - 1];
          expect(diff).to.be.at.most(1); // Can't skip levels (h1 -> h3)
        }
      });
    });

    it('should have descriptive link text', () => {
      cy.get('a').each(($link) => {
        const text = $link.text().trim();
        const aria = $link.attr('aria-label');
        
        // Must have either visible text or aria-label
        expect(text || aria).to.not.be.empty;
        
        // Avoid generic text like "click here"
        expect(text.toLowerCase()).to.not.match(/^(click here|read more|link)$/);
      });
    });

    it('should have alt text for all images', () => {
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    });

    it('should have proper button markup', () => {
      // Interactive elements should be <button> or have role="button"
      cy.get('[onclick], [ng-click]').should('not.exist');
      
      cy.get('div[role="button"], span[role="button"]').each(($el) => {
        // If using role="button", must have tabindex and keyboard handlers
        cy.wrap($el).should('have.attr', 'tabindex');
      });
    });

    it('should have form labels', () => {
      cy.get('input, select, textarea').each(($input) => {
        const id = $input.attr('id');
        if (id) {
          // Should have associated label
          cy.get(`label[for="${id}"], label:has(#${id})`).should('exist');
        } else {
          // Or aria-label/aria-labelledby
          const hasLabel = $input.attr('aria-label') || $input.attr('aria-labelledby');
          expect(hasLabel).to.exist;
        }
      });
    });

    it('should have focus indicators', () => {
      cy.get('button').first().focus();
      cy.focused().then(($el) => {
        const outline = $el.css('outline');
        const boxShadow = $el.css('box-shadow');
        
        // Must have visible focus indicator
        expect(outline !== 'none' || boxShadow !== 'none').to.be.true;
      });
    });

    it('should support keyboard navigation', () => {
      cy.get('body').tab();
      cy.focused().should('be.visible');
      
      // Tab through all interactive elements
      cy.get('button, a, input, select, textarea').each(() => {
        cy.focused().tab();
        cy.focused().should('be.visible');
      });
    });

    it('should activate buttons with Enter/Space', () => {
      cy.get('button').first().focus();
      cy.focused().trigger('keydown', { key: 'Enter' });
      
      // Button should be activated (check for expected behavior)
      // In production: verify button action was triggered
    });

    it('should have ARIA landmarks', () => {
      cy.get('[role="main"], main').should('exist');
      cy.get('[role="navigation"], nav').should('exist');
      cy.get('[role="contentinfo"], footer').should('exist');
    });

    it('should have skip links', () => {
      cy.get('a[href^="#"]').first().should('exist');
      cy.get('a[href^="#"]').first().should('contain', 'Skip');
    });

    it('should announce dynamic content to screen readers', () => {
      // Submit a request
      cy.contains('Housekeeping').click();
      cy.contains('Request Towels').click();
      cy.get('[data-testid="submit-request"]').click();
      
      // Should have aria-live region with status
      cy.get('[aria-live="polite"], [aria-live="assertive"]', { timeout: 5000 })
        .should('exist')
        .and('not.be.empty');
    });

    it('should have proper color contrast (WCAG AA)', () => {
      // Check text contrast ratios
      cy.get('p, span, div').each(($el) => {
        const color = $el.css('color');
        const bgColor = $el.css('background-color');
        
        if (color && bgColor) {
          const contrastRatio = calculateContrastRatio(color, bgColor);
          
          // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
          const fontSize = parseFloat($el.css('font-size'));
          const minContrast = fontSize >= 18 ? 3 : 4.5;
          
          expect(contrastRatio).to.be.at.least(minContrast);
        }
      });
    });

    it('should not rely on color alone', () => {
      // Error messages should have icons or text, not just red color
      cy.get('.error, [role="alert"]').each(($el) => {
        const hasIcon = $el.find('svg, .icon').length > 0;
        const hasText = $el.text().trim().length > 0;
        
        expect(hasIcon || hasText).to.be.true;
      });
    });

    it('should have touch targets ≥44x44px', () => {
      cy.viewport('iphone-x');
      
      cy.get('button, a').each(($el) => {
        const height = $el.height() || 0;
        const width = $el.width() || 0;
        
        expect(height).to.be.at.least(44);
        expect(width).to.be.at.least(44);
      });
    });

    it('should not have ARIA errors', () => {
      // Check for common ARIA mistakes
      cy.get('[aria-labelledby]').each(($el) => {
        const id = $el.attr('aria-labelledby');
        cy.get(`#${id}`).should('exist');
      });
      
      cy.get('[aria-describedby]').each(($el) => {
        const id = $el.attr('aria-describedby');
        cy.get(`#${id}`).should('exist');
      });
    });
  });

  describe('Staff Dashboard Accessibility', () => {
    beforeEach(() => {
      cy.visit('/');
      cy.get('[data-testid="email-input"]').type('owner@hotel.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      cy.visit('/owner/qr-analytics');
    });

    it('should have accessible charts', () => {
      cy.get('[data-testid="scan-trends-chart"]').should('have.attr', 'role', 'img');
      cy.get('[data-testid="scan-trends-chart"]').should('have.attr', 'aria-label');
    });

    it('should provide data table alternative for charts', () => {
      cy.contains('View as Table').click();
      cy.get('table').should('be.visible');
      
      // Table should have proper structure
      cy.get('table').find('thead').should('exist');
      cy.get('table').find('th').should('have.length.greaterThan', 0);
    });

    it('should have keyboard-accessible dropdown menus', () => {
      cy.get('[data-testid="service-type-filter"]').focus();
      cy.focused().trigger('keydown', { key: 'Enter' });
      
      // Dropdown should open
      cy.get('[role="listbox"], [role="menu"]').should('be.visible');
      
      // Arrow keys should navigate options
      cy.focused().trigger('keydown', { key: 'ArrowDown' });
      cy.focused().should('have.attr', 'role', 'option');
    });
  });

  describe('Modal Dialog Accessibility', () => {
    it('should trap focus within modal', () => {
      // Open a modal
      cy.visit('/front-desk');
      cy.contains('New Reservation').click();
      
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
      
      // Focus should be trapped
      const focusableElements = ['button', 'a', 'input', 'select', 'textarea'];
      cy.get(`[role="dialog"] ${focusableElements.join(', [role="dialog"] ')}`).then(($els) => {
        const count = $els.length;
        
        // Tab through all elements (should loop back to first)
        for (let i = 0; i < count + 1; i++) {
          cy.focused().tab();
        }
        
        // Should be back at first element
        cy.focused().should('equal', $els[0]);
      });
    });

    it('should close modal with Escape key', () => {
      cy.visit('/front-desk');
      cy.contains('New Reservation').click();
      
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
      cy.get('body').trigger('keydown', { key: 'Escape' });
      
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('should return focus after modal closes', () => {
      cy.visit('/front-desk');
      cy.contains('New Reservation').click().should('be.focused');
      
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible');
      cy.get('body').trigger('keydown', { key: 'Escape' });
      
      // Focus should return to trigger button
      cy.focused().should('contain', 'New Reservation');
    });

    it('should have proper ARIA attributes', () => {
      cy.visit('/front-desk');
      cy.contains('New Reservation').click();
      
      cy.get('[role="dialog"]').should('have.attr', 'aria-modal', 'true');
      cy.get('[role="dialog"]').should('have.attr', 'aria-labelledby');
      cy.get('[role="dialog"]').should('have.attr', 'aria-describedby');
    });
  });

  describe('Form Accessibility', () => {
    beforeEach(() => {
      cy.visit('/guest/qr/test-token');
      cy.contains('Housekeeping').click();
    });

    it('should have required field indicators', () => {
      cy.get('input[required], select[required], textarea[required]').each(($el) => {
        // Should have asterisk or aria-required
        const label = cy.get(`label[for="${$el.attr('id')}"]`);
        label.should('exist');
        
        const hasIndicator = label.text().includes('*') || $el.attr('aria-required') === 'true';
        expect(hasIndicator).to.be.true;
      });
    });

    it('should show validation errors clearly', () => {
      cy.get('[data-testid="submit-request"]').click();
      
      // Error should be associated with field
      cy.get('[aria-invalid="true"], .error').should('exist');
      cy.get('[role="alert"], [aria-live="assertive"]').should('exist');
    });

    it('should provide helpful error messages', () => {
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('[data-testid="submit-request"]').click();
      
      cy.get('[role="alert"]').should('contain', 'email');
    });

    it('should support autocomplete attributes', () => {
      cy.get('input[type="email"]').should('have.attr', 'autocomplete');
      cy.get('input[type="tel"]').should('have.attr', 'autocomplete', 'tel');
    });
  });

  describe('Automated Accessibility Testing', () => {
    it('should pass axe-core accessibility audit', () => {
      cy.visit('/guest/qr/test-token');
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should have no critical violations', () => {
      cy.visit('/guest/qr/test-token');
      cy.injectAxe();
      cy.checkA11y(null, {
        includedImpacts: ['critical']
      });
    });

    it('should pass WCAG 2.1 AA standards', () => {
      cy.visit('/guest/qr/test-token');
      cy.injectAxe();
      cy.checkA11y(null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        }
      });
    });
  });
});

// Helper function to calculate contrast ratio
function calculateContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string) => {
    const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
    const [r, g, b] = rgb.map(c => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}
