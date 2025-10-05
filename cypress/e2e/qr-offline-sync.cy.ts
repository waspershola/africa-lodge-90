describe('QR Offline Sync E2E', () => {
  beforeEach(() => {
    // Start with a valid session
    cy.visit('/guest/qr/test-offline-token');
    cy.contains('Guest Services', { timeout: 10000 }).should('be.visible');
  });

  describe('Network Status Detection', () => {
    it('should show online indicator when connected', () => {
      cy.get('[data-testid="offline-indicator"]').should('contain', 'Online');
      cy.get('[data-testid="online-status"]').should('be.visible');
    });

    it('should detect network disconnection', () => {
      // Go offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      // Should show offline indicator
      cy.get('[data-testid="offline-indicator"]', { timeout: 5000 }).should('contain', 'Offline');
      cy.get('[data-testid="offline-status"]').should('be.visible');
    });

    it('should detect network reconnection', () => {
      // Go offline then back online
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.wait(1000);
      
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(true);
        win.dispatchEvent(new Event('online'));
      });
      
      // Should show online again
      cy.get('[data-testid="offline-indicator"]', { timeout: 5000 }).should('contain', 'Online');
    });
  });

  describe('Offline Request Queueing', () => {
    it('should queue request when offline', () => {
      // Go offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      // Try to create a request
      cy.contains('Housekeeping').click();
      cy.contains('Request Towels').click();
      cy.get('[data-testid="submit-request"]').click();
      
      // Should show "saved offline" message
      cy.contains('Saved offline', { matchCase: false, timeout: 5000 }).should('be.visible');
      cy.contains('will send when back online', { matchCase: false }).should('be.visible');
    });

    it('should store queued request in IndexedDB', () => {
      // Go offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      // Create request
      cy.contains('Housekeeping').click();
      cy.contains('Request Towels').click();
      cy.get('[data-testid="submit-request"]').click();
      
      // Verify IndexedDB storage
      cy.window().then(async (win) => {
        const request = indexedDB.open('GuestPortalOffline', 1);
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction(['requests'], 'readonly');
          const store = transaction.objectStore('requests');
          const getAll = store.getAll();
          
          getAll.onsuccess = () => {
            const requests = getAll.result;
            expect(requests.length).to.be.greaterThan(0);
            expect(requests[0]).to.have.property('syncStatus', 'pending');
          };
        };
      });
    });

    it('should show pending requests count', () => {
      // Go offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      // Create 3 requests
      for (let i = 0; i < 3; i++) {
        cy.contains('Housekeeping').click();
        cy.contains('Request Towels').click();
        cy.get('[data-testid="submit-request"]').click();
        cy.wait(500);
        cy.get('[data-testid="back-button"]').click();
      }
      
      // Should show "3 pending"
      cy.get('[data-testid="offline-indicator"]').should('contain', '3');
    });
  });

  describe('Automatic Sync on Reconnect', () => {
    it('should auto-sync pending requests when back online', () => {
      // Queue request while offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.contains('Housekeeping').click();
      cy.contains('Request Towels').click();
      cy.get('[data-testid="submit-request"]').click();
      cy.wait(1000);
      
      // Go back online
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(true);
        win.dispatchEvent(new Event('online'));
      });
      
      // Should show "Syncing..." then "Synced"
      cy.contains('Syncing', { timeout: 5000 }).should('be.visible');
      cy.contains('Synced', { timeout: 10000 }).should('be.visible');
    });

    it('should update request status after sync', () => {
      // Queue and sync request
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.contains('Housekeeping').click();
      cy.contains('Request Towels').click();
      cy.get('[data-testid="submit-request"]').click();
      cy.wait(1000);
      
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(true);
        win.dispatchEvent(new Event('online'));
      });
      
      // Wait for sync
      cy.contains('Synced', { timeout: 10000 }).should('be.visible');
      
      // Request should now show "Submitted" status
      cy.contains('Your Requests').click();
      cy.contains('Submitted', { timeout: 5000 }).should('be.visible');
    });

    it('should clear IndexedDB after successful sync', () => {
      // Queue and sync request
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.contains('Housekeeping').click();
      cy.contains('Request Towels').click();
      cy.get('[data-testid="submit-request"]').click();
      cy.wait(1000);
      
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(true);
        win.dispatchEvent(new Event('online'));
      });
      
      cy.contains('Synced', { timeout: 10000 }).should('be.visible');
      
      // IndexedDB should be empty
      cy.window().then(async (win) => {
        const request = indexedDB.open('GuestPortalOffline', 1);
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction(['requests'], 'readonly');
          const store = transaction.objectStore('requests');
          const getAll = store.getAll();
          
          getAll.onsuccess = () => {
            const requests = getAll.result.filter((r: any) => r.syncStatus === 'pending');
            expect(requests.length).to.equal(0);
          };
        };
      });
    });
  });

  describe('Manual Sync Retry', () => {
    it('should have manual "Retry Sync" button', () => {
      // Queue request while offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.contains('Housekeeping').click();
      cy.contains('Request Towels').click();
      cy.get('[data-testid="submit-request"]').click();
      
      // Retry button should be visible
      cy.get('[data-testid="retry-sync-button"]').should('be.visible');
    });

    it('should trigger sync on manual retry', () => {
      // Queue request while offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.contains('Housekeeping').click();
      cy.contains('Request Towels').click();
      cy.get('[data-testid="submit-request"]').click();
      
      // Go online but don't auto-sync yet
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(true);
      });
      
      // Click retry
      cy.get('[data-testid="retry-sync-button"]').click();
      
      // Should start syncing
      cy.contains('Syncing', { timeout: 3000 }).should('be.visible');
    });
  });

  describe('Failed Sync Handling', () => {
    it('should retry failed syncs with exponential backoff', () => {
      // Mock API to fail first 2 attempts
      let attemptCount = 0;
      cy.intercept('POST', '**/qr-unified-api/request', (req) => {
        attemptCount++;
        if (attemptCount <= 2) {
          req.reply({ statusCode: 500, body: { error: 'Server error' } });
        } else {
          req.reply({ statusCode: 200, body: { id: 'request-123', status: 'pending' } });
        }
      });
      
      // Queue request
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.contains('Housekeeping').click();
      cy.contains('Request Towels').click();
      cy.get('[data-testid="submit-request"]').click();
      
      // Go online
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(true);
        win.dispatchEvent(new Event('online'));
      });
      
      // Should eventually succeed after retries
      cy.contains('Synced', { timeout: 30000 }).should('be.visible');
    });

    it('should show error after max retries', () => {
      // Mock API to always fail
      cy.intercept('POST', '**/qr-unified-api/request', {
        statusCode: 500,
        body: { error: 'Server error' }
      });
      
      // Queue request
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.contains('Housekeeping').click();
      cy.contains('Request Towels').click();
      cy.get('[data-testid="submit-request"]').click();
      
      // Go online
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(true);
        win.dispatchEvent(new Event('online'));
      });
      
      // Should show sync failed
      cy.contains('Sync failed', { timeout: 30000 }).should('be.visible');
    });

    it('should preserve failed requests in IndexedDB', () => {
      // Mock API to fail
      cy.intercept('POST', '**/qr-unified-api/request', {
        statusCode: 500,
        body: { error: 'Server error' }
      });
      
      // Queue and attempt sync
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.contains('Housekeeping').click();
      cy.contains('Request Towels').click();
      cy.get('[data-testid="submit-request"]').click();
      
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(true);
        win.dispatchEvent(new Event('online'));
      });
      
      cy.contains('Sync failed', { timeout: 30000 }).should('be.visible');
      
      // Request should still be in IndexedDB
      cy.window().then(async (win) => {
        const request = indexedDB.open('GuestPortalOffline', 1);
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction(['requests'], 'readonly');
          const store = transaction.objectStore('requests');
          const getAll = store.getAll();
          
          getAll.onsuccess = () => {
            const requests = getAll.result;
            expect(requests.length).to.be.greaterThan(0);
            expect(requests[0].syncStatus).to.equal('failed');
          };
        };
      });
    });
  });

  describe('Data Persistence', () => {
    it('should persist queued requests across page reload', () => {
      // Queue request while offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.contains('Housekeeping').click();
      cy.contains('Request Towels').click();
      cy.get('[data-testid="submit-request"]').click();
      
      cy.wait(1000);
      
      // Reload page
      cy.reload();
      
      // Should still show pending request
      cy.get('[data-testid="offline-indicator"]', { timeout: 5000 }).should('contain', '1');
    });

    it('should cache menu data for offline access', () => {
      // Load menu while online
      cy.contains('Room Service').click();
      cy.contains('Menu', { timeout: 5000 }).should('be.visible');
      cy.get('[data-testid="back-button"]').click();
      
      // Go offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      // Menu should still load from cache
      cy.contains('Room Service').click();
      cy.contains('Menu', { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Service Worker', () => {
    it('should install service worker', () => {
      cy.window().then((win) => {
        expect(win.navigator.serviceWorker).to.exist;
        
        win.navigator.serviceWorker.getRegistrations().then((registrations) => {
          expect(registrations.length).to.be.greaterThan(0);
        });
      });
    });

    it('should serve offline fallback page when no network', () => {
      // Unregister service worker, go offline, try to load new page
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.visit('/guest/qr/new-token', { failOnStatusCode: false });
      
      // Should show offline page
      cy.contains('You are offline', { matchCase: false, timeout: 10000 }).should('be.visible');
    });
  });
});
