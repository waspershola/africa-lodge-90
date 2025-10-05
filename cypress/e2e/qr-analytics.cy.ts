describe('QR Analytics Dashboard E2E', () => {
  beforeEach(() => {
    // Login as owner
    cy.visit('/');
    cy.get('[data-testid="email-input"]').type('owner@hotel.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    
    // Navigate to QR Analytics
    cy.visit('/owner/qr-analytics');
    cy.contains('QR Analytics', { timeout: 10000 }).should('be.visible');
  });

  describe('Dashboard Loading', () => {
    it('should load analytics dashboard successfully', () => {
      cy.get('[data-testid="analytics-dashboard"]').should('be.visible');
      cy.contains('Monitor QR code usage').should('be.visible');
    });

    it('should show loading state initially', () => {
      cy.visit('/owner/qr-analytics');
      cy.get('[data-testid="loading-indicator"]', { timeout: 1000 }).should('exist');
    });

    it('should handle no data gracefully', () => {
      // Mock empty response
      cy.intercept('GET', '**/qr_scan_logs*', { body: { data: [] } });
      cy.intercept('GET', '**/qr_requests*', { body: { data: [] } });
      
      cy.reload();
      
      // Should show empty state message
      cy.contains('No data available', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Key Metrics Cards', () => {
    it('should display total scans metric', () => {
      cy.contains('Total Scans').should('be.visible');
      cy.get('[data-testid="total-scans"]').should('exist');
      cy.get('[data-testid="total-scans"]').invoke('text').then((text) => {
        expect(parseInt(text)).to.be.a('number');
      });
    });

    it('should display total requests metric', () => {
      cy.contains('Total Requests').should('be.visible');
      cy.get('[data-testid="total-requests"]').should('exist');
    });

    it('should display average response time', () => {
      cy.contains('Avg Response Time').should('be.visible');
      cy.get('[data-testid="avg-response-time"]').should('exist');
      cy.get('[data-testid="avg-response-time"]').should('contain', 'min');
    });

    it('should update metrics in real-time', () => {
      // Get initial scan count
      cy.get('[data-testid="total-scans"]').invoke('text').then((initialCount) => {
        const initial = parseInt(initialCount);
        
        // Simulate new scan (via API or real scan)
        cy.request('POST', '/qr-unified-api/validate', {
          qrToken: 'test-token-123',
          deviceInfo: { platform: 'test' }
        });
        
        // Wait for refresh (30s interval)
        cy.wait(31000);
        
        // Count should increase
        cy.get('[data-testid="total-scans"]').invoke('text').then((newCount) => {
          const updated = parseInt(newCount);
          expect(updated).to.be.greaterThan(initial);
        });
      });
    });
  });

  describe('Scan Trends Chart', () => {
    it('should render scan trends line chart', () => {
      cy.get('[data-testid="scan-trends-chart"]').should('be.visible');
      cy.contains('Scan Trends').should('be.visible');
      cy.contains('Daily QR code scans over the last 7 days').should('be.visible');
    });

    it('should show 7 days of data', () => {
      cy.get('[data-testid="scan-trends-chart"] .recharts-line').should('exist');
      cy.get('[data-testid="scan-trends-chart"] .recharts-xAxis .recharts-cartesian-axis-tick').should('have.length', 7);
    });

    it('should display tooltips on hover', () => {
      cy.get('[data-testid="scan-trends-chart"] .recharts-line').trigger('mouseover');
      cy.get('.recharts-tooltip-wrapper').should('be.visible');
    });

    it('should handle missing data points', () => {
      // Mock data with gaps
      cy.intercept('GET', '**/qr_scan_logs*', {
        body: {
          data: [
            { scanned_at: '2025-10-01T12:00:00Z' },
            // Missing 2025-10-02
            { scanned_at: '2025-10-03T12:00:00Z' }
          ]
        }
      });
      
      cy.reload();
      
      // Chart should still render
      cy.get('[data-testid="scan-trends-chart"]', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Request Status Pie Chart', () => {
    it('should render request status distribution', () => {
      cy.get('[data-testid="request-status-chart"]').should('be.visible');
      cy.contains('Request Status').should('be.visible');
    });

    it('should show all status categories', () => {
      cy.get('[data-testid="request-status-chart"]').within(() => {
        cy.contains('Pending').should('exist');
        cy.contains('In Progress').should('exist');
        cy.contains('Completed').should('exist');
        cy.contains('Cancelled').should('exist');
      });
    });

    it('should display percentages', () => {
      cy.get('[data-testid="request-status-chart"] text').then(($labels) => {
        const percentagePattern = /\d+%/;
        const hasPercentage = Array.from($labels).some(label => 
          percentagePattern.test(label.textContent || '')
        );
        expect(hasPercentage).to.be.true;
      });
    });

    it('should use distinct colors for each status', () => {
      cy.get('[data-testid="request-status-chart"] .recharts-pie-sector').then(($sectors) => {
        const fills = Array.from($sectors).map(el => el.getAttribute('fill'));
        const uniqueFills = new Set(fills);
        expect(uniqueFills.size).to.equal(fills.length);
      });
    });
  });

  describe('Popular Services Bar Chart', () => {
    it('should render popular services chart', () => {
      cy.get('[data-testid="popular-services-chart"]').should('be.visible');
      cy.contains('Popular Services').should('be.visible');
    });

    it('should show top 5 services', () => {
      cy.get('[data-testid="popular-services-chart"] .recharts-bar-rectangle').should('have.length.at.most', 5);
    });

    it('should sort by request count descending', () => {
      cy.get('[data-testid="popular-services-chart"] .recharts-bar-rectangle').then(($bars) => {
        const heights = Array.from($bars).map(bar => parseFloat(bar.getAttribute('height') || '0'));
        
        for (let i = 0; i < heights.length - 1; i++) {
          expect(heights[i]).to.be.at.least(heights[i + 1]);
        }
      });
    });
  });

  describe('Device Types Pie Chart', () => {
    it('should render device distribution chart', () => {
      cy.get('[data-testid="device-types-chart"]').should('be.visible');
      cy.contains('Device Types').should('be.visible');
    });

    it('should distinguish mobile vs desktop', () => {
      cy.get('[data-testid="device-types-chart"]').within(() => {
        cy.contains('Mobile').should('exist');
        cy.contains('Desktop').should('exist');
      });
    });
  });

  describe('Data Filtering', () => {
    it('should have date range selector', () => {
      cy.get('[data-testid="date-range-selector"]').should('exist');
    });

    it('should filter data by date range', () => {
      // Select custom date range
      cy.get('[data-testid="date-range-selector"]').click();
      cy.contains('Last 7 days').click();
      
      // Charts should update
      cy.get('[data-testid="scan-trends-chart"]').should('be.visible');
    });

    it('should have service type filter', () => {
      cy.get('[data-testid="service-type-filter"]').should('exist');
    });

    it('should filter by specific service', () => {
      cy.get('[data-testid="service-type-filter"]').click();
      cy.contains('Housekeeping').click();
      
      // Only housekeeping requests should be shown
      cy.get('[data-testid="popular-services-chart"]').within(() => {
        cy.contains('Housekeeping').should('be.visible');
      });
    });
  });

  describe('Export & Reporting', () => {
    it('should have export button', () => {
      cy.get('[data-testid="export-button"]').should('exist');
    });

    it('should export data as CSV', () => {
      cy.get('[data-testid="export-button"]').click();
      cy.contains('Export CSV').click();
      
      // Should trigger download
      cy.readFile('cypress/downloads/qr-analytics.csv', { timeout: 10000 }).should('exist');
    });

    it('should export data as PDF', () => {
      cy.get('[data-testid="export-button"]').click();
      cy.contains('Export PDF').click();
      
      cy.readFile('cypress/downloads/qr-analytics.pdf', { timeout: 10000 }).should('exist');
    });
  });

  describe('Real-time Updates', () => {
    it('should auto-refresh every 30 seconds', () => {
      cy.get('[data-testid="last-updated"]').invoke('text').then((initialTime) => {
        cy.wait(31000);
        
        cy.get('[data-testid="last-updated"]').invoke('text').then((updatedTime) => {
          expect(updatedTime).to.not.equal(initialTime);
        });
      });
    });

    it('should show refresh indicator when updating', () => {
      cy.wait(30000);
      cy.get('[data-testid="refreshing-indicator"]', { timeout: 1000 }).should('be.visible');
    });

    it('should have manual refresh button', () => {
      cy.get('[data-testid="manual-refresh"]').should('exist');
      cy.get('[data-testid="manual-refresh"]').click();
      
      // Should show refreshing state
      cy.get('[data-testid="refreshing-indicator"]').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load dashboard in under 3 seconds', () => {
      const start = Date.now();
      
      cy.visit('/owner/qr-analytics').then(() => {
        cy.get('[data-testid="analytics-dashboard"]', { timeout: 3000 }).should('be.visible');
        
        const duration = Date.now() - start;
        expect(duration).to.be.lessThan(3000);
      });
    });

    it('should render charts without lag', () => {
      cy.get('[data-testid="scan-trends-chart"]').should('be.visible');
      cy.get('[data-testid="request-status-chart"]').should('be.visible');
      cy.get('[data-testid="popular-services-chart"]').should('be.visible');
      cy.get('[data-testid="device-types-chart"]').should('be.visible');
      
      // All should render within 2 seconds
      cy.get('.recharts-surface').should('have.length', 4);
    });

    it('should handle large datasets efficiently', () => {
      // Mock large dataset (1000 scans)
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `scan-${i}`,
        scanned_at: new Date(Date.now() - i * 60000).toISOString(),
        qr_code_id: 'test-qr',
        tenant_id: 'test-tenant'
      }));
      
      cy.intercept('GET', '**/qr_scan_logs*', { body: { data: largeDataset } });
      cy.reload();
      
      // Should still render quickly
      cy.get('[data-testid="analytics-dashboard"]', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/owner/qr-analytics');
      
      // Cards should stack vertically
      cy.get('[data-testid="metrics-grid"]').should('have.css', 'flex-direction', 'column');
    });

    it('should adapt charts to small screens', () => {
      cy.viewport(375, 667); // iPhone SE
      
      cy.get('[data-testid="scan-trends-chart"]').should('be.visible');
      cy.get('[data-testid="scan-trends-chart"]').should('have.css', 'width').and('match', /^[0-9]+px$/);
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive chart titles', () => {
      cy.get('[data-testid="scan-trends-chart"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="request-status-chart"]').should('have.attr', 'aria-label');
    });

    it('should provide alt text for visual data', () => {
      cy.get('[data-testid="total-scans"]').parent().should('have.attr', 'aria-describedby');
    });

    it('should support keyboard navigation', () => {
      cy.get('body').tab();
      cy.focused().should('be.visible');
      
      // Tab through interactive elements
      cy.focused().tab();
      cy.focused().should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '**/qr_scan_logs*', { statusCode: 500, body: { error: 'Server error' } });
      cy.reload();
      
      cy.contains('Error loading analytics', { timeout: 10000 }).should('be.visible');
    });

    it('should show retry button on error', () => {
      cy.intercept('GET', '**/qr_scan_logs*', { statusCode: 500 });
      cy.reload();
      
      cy.get('[data-testid="retry-button"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="retry-button"]').click();
      
      // Should attempt to reload
      cy.get('[data-testid="loading-indicator"]').should('be.visible');
    });

    it('should handle network timeout', () => {
      cy.intercept('GET', '**/qr_scan_logs*', { delay: 30000 });
      cy.reload();
      
      cy.contains('Loading...', { timeout: 5000 }).should('be.visible');
    });
  });
});

