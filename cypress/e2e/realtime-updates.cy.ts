describe('Real-time Updates E2E', () => {
  beforeEach(() => {
    // Mock authentication for staff user
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'staff-user', email: 'staff@hotel.com', role: 'FRONT_DESK' },
        session: { access_token: 'mock-token' }
      }))
    })
  })

  it('should show real-time room status updates', () => {
    cy.visit('/hotel/dashboard')
    
    // Open two windows to simulate real-time updates
    cy.window().then((win1) => {
      cy.visit('/hotel/dashboard', { 
        onBeforeLoad: (win2) => {
          // Simulate room status change from another window
          setTimeout(() => {
            win2.postMessage({
              type: 'ROOM_STATUS_UPDATE',
              payload: { roomId: 'room-101', status: 'occupied' }
            }, '*')
          }, 2000)
        }
      })
    })
    
    // Wait for real-time update
    cy.get('[data-testid="room-101"]', { timeout: 5000 })
      .should('have.class', 'occupied')
  })

  it('should show real-time POS order updates', () => {
    cy.visit('/pos/dashboard')
    
    // Check initial order count
    cy.get('[data-cy="pending-orders-count"]').then(($count) => {
      const initialCount = parseInt($count.text())
      
      // Simulate new order from QR portal
      cy.window().then((win) => {
        win.postMessage({
          type: 'NEW_POS_ORDER',
          payload: { orderId: 'order-123', items: 2, total: 2500 }
        }, '*')
      })
      
      // Verify count updated
      cy.get('[data-cy="pending-orders-count"]')
        .should('contain', initialCount + 1)
    })
  })

  it('should show real-time housekeeping task updates', () => {
    cy.visit('/housekeeping/tasks')
    
    // Verify initial task list
    cy.get('[data-cy="task-list"]').should('be.visible')
    
    // Simulate task assignment
    cy.window().then((win) => {
      win.postMessage({
        type: 'TASK_ASSIGNED',
        payload: { 
          taskId: 'task-123', 
          roomNumber: '201', 
          type: 'cleaning',
          assignedTo: 'staff-user'
        }
      }, '*')
    })
    
    // Verify new task appears
    cy.get('[data-cy="task-item"]')
      .contains('Room 201')
      .should('be.visible')
  })

  it('should handle connection loss gracefully', () => {
    cy.visit('/hotel/dashboard')
    
    // Simulate network disconnection
    cy.window().then((win) => {
      // Mock offline status
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        value: false
      })
      
      win.dispatchEvent(new Event('offline'))
    })
    
    // Verify offline indicator
    cy.get('[data-cy="offline-indicator"]').should('be.visible')
    
    // Simulate reconnection
    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        value: true
      })
      
      win.dispatchEvent(new Event('online'))
    })
    
    // Verify sync indicator
    cy.get('[data-cy="sync-indicator"]').should('be.visible')
  })
})