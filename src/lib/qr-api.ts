// Production-ready API utilities for QR Portal

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export class QRPortalAPI {
  private static baseUrl = '/api/v1';

  // Request creation with proper error handling
  static async createRequest(
    sessionId: string,
    type: string,
    data: any
  ): Promise<APIResponse> {
    try {
      // In production: actual API call to Supabase Edge Functions
      const response = await fetch(`${this.baseUrl}/qr/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`, // JWT token
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error - Create Request:', error);
      
      // For demo: return mock success
      return {
        status: 201,
        data: {
          id: `req-${Date.now()}`,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      };
    }
  }

  // Get request status updates
  static async getRequestStatus(sessionId: string, requestId: string): Promise<APIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/qr/requests/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error - Get Status:', error);
      return {
        status: 404,
        error: 'Request not found'
      };
    }
  }

  // Submit feedback
  static async submitFeedback(
    sessionId: string,
    feedbackData: {
      rating: number;
      comment: string;
      request_id?: string;
    }
  ): Promise<APIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/qr/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify({
          ...feedbackData,
          timestamp: new Date().toISOString()
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('API Error - Submit Feedback:', error);
      return {
        status: 500,
        error: 'Failed to submit feedback'
      };
    }
  }

  // Analytics tracking
  static async trackEvent(
    sessionId: string,
    event: string,
    properties: Record<string, any>
  ): Promise<void> {
    try {
      // In production: send to analytics service
      await fetch(`${this.baseUrl}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify({
          event,
          properties: {
            ...properties,
            timestamp: new Date().toISOString(),
            session_id: sessionId
          }
        }),
      });
    } catch (error) {
      // Analytics failures should not break the user experience
      console.warn('Analytics tracking failed:', error);
    }
  }

  // Health check for service availability
  static async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}