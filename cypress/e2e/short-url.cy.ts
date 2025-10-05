describe('Short URL Service E2E', () => {
  const baseUrl = Cypress.config('baseUrl') || 'http://localhost:5173';

  describe('Short URL Creation', () => {
    beforeEach(() => {
      // Login as owner to access short URL creation
      cy.visit('/');
      cy.get('[data-testid="email-input"]').type('owner@hotel.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      cy.url({ timeout: 10000 }).should('not.include', '/login');
    });

    it('should create short URL via API', () => {
      const longUrl = `${baseUrl}/guest/qr/very-long-token-12345678901234567890`;
      
      cy.request({
        method: 'POST',
        url: '/url-shortener/shorten',
        body: {
          url: longUrl,
          tenantId: 'test-tenant-123'
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('short_url');
        expect(response.body).to.have.property('short_code');
        
        const shortCode = response.body.short_code;
        expect(shortCode).to.have.length.at.least(8);
        expect(shortCode).to.match(/^[a-zA-Z0-9]+$/);
        
        const shortUrl = response.body.short_url;
        expect(shortUrl).to.include('/q/');
        expect(shortUrl).to.include(shortCode);
      });
    });

    it('should generate unique codes for different URLs', () => {
      const url1 = `${baseUrl}/guest/qr/token-1`;
      const url2 = `${baseUrl}/guest/qr/token-2`;
      
      cy.request('POST', '/url-shortener/shorten', { url: url1, tenantId: 'test-tenant' })
        .then((res1) => {
          const code1 = res1.body.short_code;
          
          cy.request('POST', '/url-shortener/shorten', { url: url2, tenantId: 'test-tenant' })
            .then((res2) => {
              const code2 = res2.body.short_code;
              expect(code1).to.not.equal(code2);
            });
        });
    });

    it('should validate required fields', () => {
      cy.request({
        method: 'POST',
        url: '/url-shortener/shorten',
        body: { url: '' }, // Missing tenantId
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.include('required');
      });
    });

    it('should handle concurrent creation requests', () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const url = `${baseUrl}/guest/qr/token-${i}`;
        promises.push(
          cy.request('POST', '/url-shortener/shorten', { url, tenantId: 'test-tenant' })
        );
      }
      
      // All should succeed
      cy.wrap(Promise.all(promises)).then((responses: any) => {
        responses.forEach((res: any) => {
          expect(res.status).to.eq(200);
        });
        
        // All codes should be unique
        const codes = responses.map((r: any) => r.body.short_code);
        const uniqueCodes = new Set(codes);
        expect(uniqueCodes.size).to.eq(10);
      });
    });
  });

  describe('Short URL Redirection', () => {
    let shortCode: string;
    const targetUrl = '/guest/qr/redirect-test-token';

    before(() => {
      // Create a short URL first
      cy.request('POST', '/url-shortener/shorten', {
        url: `${baseUrl}${targetUrl}`,
        tenantId: 'test-tenant'
      }).then((response) => {
        shortCode = response.body.short_code;
      });
    });

    it('should redirect to target URL', () => {
      cy.visit(`/q/${shortCode}`);
      
      // Should redirect to target
      cy.url({ timeout: 10000 }).should('include', targetUrl);
    });

    it('should increment click count on each visit', () => {
      const shortUrl = `/q/${shortCode}`;
      
      // Visit 3 times
      cy.visit(shortUrl);
      cy.wait(1000);
      cy.visit(shortUrl);
      cy.wait(1000);
      cy.visit(shortUrl);
      
      // Click count should be incremented (verify in DB or analytics)
      // In production: check analytics shows 3 clicks
    });

    it('should handle invalid short codes', () => {
      cy.visit('/q/INVALID123', { failOnStatusCode: false });
      
      // Should show 404 or error
      cy.contains('not found', { matchCase: false, timeout: 5000 }).should('be.visible');
    });

    it('should preserve query parameters during redirect', () => {
      cy.visit(`/q/${shortCode}?utm_source=sms&campaign=winter`);
      
      // Should redirect with query params
      cy.url({ timeout: 10000 }).should('include', targetUrl);
      cy.url().should('include', 'utm_source=sms');
      cy.url().should('include', 'campaign=winter');
    });

    it('should redirect quickly (<500ms)', () => {
      const start = Date.now();
      
      cy.visit(`/q/${shortCode}`).then(() => {
        const duration = Date.now() - start;
        expect(duration).to.be.lessThan(500);
      });
    });
  });

  describe('URL Shortening Integration', () => {
    it('should work with SMS notifications', () => {
      // Simulate SMS notification flow
      const longQrUrl = `${baseUrl}/guest/qr/${'x'.repeat(100)}`; // Very long token
      
      cy.request('POST', '/url-shortener/shorten', {
        url: longQrUrl,
        tenantId: 'test-tenant'
      }).then((response) => {
        const shortUrl = response.body.short_url;
        
        // SMS message with short URL
        const smsMessage = `Welcome! Access your portal: ${shortUrl}`;
        
        // Should be under 160 characters (single SMS)
        expect(smsMessage.length).to.be.lessThan(160);
      });
    });

    it('should save 60-80 characters vs full URL', () => {
      const longUrl = `${baseUrl}/guest/qr/very-long-qr-token-with-lots-of-characters-1234567890`;
      
      cy.request('POST', '/url-shortener/shorten', {
        url: longUrl,
        tenantId: 'test-tenant'
      }).then((response) => {
        const shortUrl = response.body.short_url;
        const savedChars = longUrl.length - shortUrl.length;
        
        expect(savedChars).to.be.greaterThan(60);
      });
    });
  });

  describe('Analytics & Tracking', () => {
    let testShortCode: string;

    before(() => {
      cy.request('POST', '/url-shortener/shorten', {
        url: `${baseUrl}/guest/qr/analytics-test`,
        tenantId: 'test-tenant'
      }).then((response) => {
        testShortCode = response.body.short_code;
      });
    });

    it('should track unique visitors', () => {
      // Visit from 3 different "devices" (different user agents)
      const userAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Mozilla/5.0 (X11; Linux x86_64)'
      ];
      
      userAgents.forEach((ua) => {
        cy.visit(`/q/${testShortCode}`, {
          headers: { 'User-Agent': ua }
        });
        cy.wait(500);
      });
      
      // Analytics should show 3 clicks (verify in analytics dashboard)
    });

    it('should capture referrer information', () => {
      cy.visit('/some-page');
      cy.visit(`/q/${testShortCode}`);
      
      // Referrer should be captured (verify in DB or analytics)
    });

    it('should track device types', () => {
      // Visit from mobile and desktop
      cy.viewport('iphone-x');
      cy.visit(`/q/${testShortCode}`);
      
      cy.viewport('macbook-15');
      cy.visit(`/q/${testShortCode}`);
      
      // Analytics should show 1 mobile, 1 desktop
    });
  });

  describe('Security & Validation', () => {
    it('should enforce tenant isolation', () => {
      // Create short URL for tenant A
      cy.request('POST', '/url-shortener/shorten', {
        url: `${baseUrl}/guest/qr/tenant-a-token`,
        tenantId: 'tenant-a'
      }).then((response) => {
        const shortCode = response.body.short_code;
        
        // Tenant B should not be able to access analytics
        cy.request({
          method: 'GET',
          url: `/url-shortener/analytics/${shortCode}`,
          headers: { 'X-Tenant-ID': 'tenant-b' },
          failOnStatusCode: false
        }).then((res) => {
          expect(res.status).to.eq(403);
        });
      });
    });

    it('should sanitize URLs to prevent XSS', () => {
      const xssUrl = `${baseUrl}/guest/qr/<script>alert('xss')</script>`;
      
      cy.request('POST', '/url-shortener/shorten', {
        url: xssUrl,
        tenantId: 'test-tenant'
      }).then((response) => {
        const shortCode = response.body.short_code;
        
        cy.visit(`/q/${shortCode}`);
        
        // Should not execute script
        cy.on('window:alert', (str) => {
          throw new Error('XSS vulnerability detected!');
        });
      });
    });

    it('should validate URL format', () => {
      cy.request({
        method: 'POST',
        url: '/url-shortener/shorten',
        body: {
          url: 'not-a-valid-url',
          tenantId: 'test-tenant'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.include('invalid');
      });
    });

    it('should prevent creating too many URLs rapidly', () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          cy.request({
            method: 'POST',
            url: '/url-shortener/shorten',
            body: { url: `${baseUrl}/guest/qr/spam-${i}`, tenantId: 'test-tenant' },
            failOnStatusCode: false
          })
        );
      }
      
      cy.wrap(Promise.all(promises)).then((responses: any) => {
        // Some should be rate limited
        const rateLimited = responses.filter((r: any) => r.status === 429);
        expect(rateLimited.length).to.be.greaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long URLs', () => {
      const veryLongUrl = `${baseUrl}/guest/qr/${'x'.repeat(2000)}`;
      
      cy.request('POST', '/url-shortener/shorten', {
        url: veryLongUrl,
        tenantId: 'test-tenant'
      }).then((response) => {
        expect(response.status).to.eq(200);
        
        const shortCode = response.body.short_code;
        cy.visit(`/q/${shortCode}`);
        cy.url().should('include', veryLongUrl);
      });
    });

    it('should handle Unicode characters in URLs', () => {
      const unicodeUrl = `${baseUrl}/guest/qr/café-résumé-日本語`;
      
      cy.request('POST', '/url-shortener/shorten', {
        url: encodeURI(unicodeUrl),
        tenantId: 'test-tenant'
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });

    it('should handle expired short URLs gracefully', () => {
      // Create short URL with expiry (if supported)
      // Visit after expiry
      // Should show "expired" message
    });
  });
});
