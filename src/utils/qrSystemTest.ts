/**
 * QR System Testing Utilities
 * Provides functions to test the complete QR-to-SMS flow
 */

import { supabase } from "@/integrations/supabase/client";

export interface TestResult {
  success: boolean;
  step: string;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Test 1: Validate QR Code Generation
 */
export async function testQRGeneration(qrToken: string): Promise<TestResult> {
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('qr_token', qrToken)
      .single();

    if (error) {
      return {
        success: false,
        step: 'QR Generation',
        message: 'Failed to find QR code',
        error: error.message
      };
    }

    if (!data.is_active) {
      return {
        success: false,
        step: 'QR Generation',
        message: 'QR code is not active',
        data
      };
    }

    return {
      success: true,
      step: 'QR Generation',
      message: 'QR code is valid and active',
      data
    };
  } catch (error: any) {
    return {
      success: false,
      step: 'QR Generation',
      message: 'Test failed',
      error: error.message
    };
  }
}

/**
 * Test 2: Validate Session Creation
 */
export async function testSessionCreation(qrToken: string): Promise<TestResult> {
  try {
    const response = await supabase.functions.invoke('qr-unified-api/validate', {
      body: {
        qrToken,
        deviceInfo: {
          userAgent: 'QR-Test-Agent',
          language: 'en',
          timestamp: new Date().toISOString()
        }
      }
    });

    if (response.error) {
      return {
        success: false,
        step: 'Session Creation',
        message: 'Failed to create session',
        error: response.error.message
      };
    }

    const result = response.data;
    if (!result.success || !result.session) {
      return {
        success: false,
        step: 'Session Creation',
        message: 'Session creation returned invalid data',
        data: result
      };
    }

    return {
      success: true,
      step: 'Session Creation',
      message: 'Session created successfully',
      data: result.session
    };
  } catch (error: any) {
    return {
      success: false,
      step: 'Session Creation',
      message: 'Test failed',
      error: error.message
    };
  }
}

/**
 * Test 3: Validate Request Creation
 */
export async function testRequestCreation(sessionId: string, token: string): Promise<TestResult> {
  try {
    const response = await supabase.functions.invoke('qr-unified-api/request', {
      body: {
        sessionId,
        requestType: 'test',
        requestData: {
          test: true,
          description: 'Test request from QR system test'
        },
        priority: 'normal',
        smsEnabled: false
      },
      headers: {
        'x-session-token': token
      }
    });

    if (response.error) {
      return {
        success: false,
        step: 'Request Creation',
        message: 'Failed to create request',
        error: response.error.message
      };
    }

    const result = response.data;
    if (!result.success || !result.request) {
      return {
        success: false,
        step: 'Request Creation',
        message: 'Request creation returned invalid data',
        data: result
      };
    }

    return {
      success: true,
      step: 'Request Creation',
      message: 'Request created successfully',
      data: result.request
    };
  } catch (error: any) {
    return {
      success: false,
      step: 'Request Creation',
      message: 'Test failed',
      error: error.message
    };
  }
}

/**
 * Test 4: Validate SMS Template Processing
 */
export async function testSMSTemplate(tenantId: string): Promise<TestResult> {
  try {
    const { data: template, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('event_type', 'request_received')
      .eq('is_active', true)
      .single();

    if (error) {
      return {
        success: false,
        step: 'SMS Template',
        message: 'No active template found for request_received',
        error: error.message
      };
    }

    // Test template processing
    const response = await supabase.functions.invoke('sms-template-processor', {
      body: {
        tenant_id: tenantId,
        event_type: 'request_received',
        variables: {
          hotel: 'Test Hotel',
          guest_name: 'Test Guest',
          request_type: 'Test Request',
          tracking_number: 'TEST-001'
        },
        send_sms: false
      }
    });

    if (response.error) {
      return {
        success: false,
        step: 'SMS Template',
        message: 'Template processing failed',
        error: response.error.message
      };
    }

    return {
      success: true,
      step: 'SMS Template',
      message: 'Template processed successfully',
      data: {
        template,
        processed: response.data
      }
    };
  } catch (error: any) {
    return {
      success: false,
      step: 'SMS Template',
      message: 'Test failed',
      error: error.message
    };
  }
}

/**
 * Test 5: Validate SMS Provider
 */
export async function testSMSProvider(): Promise<TestResult> {
  try {
    const { data: providers, error } = await supabase
      .from('sms_providers')
      .select('*')
      .eq('is_enabled', true)
      .order('priority', { ascending: true });

    if (error) {
      return {
        success: false,
        step: 'SMS Provider',
        message: 'Failed to fetch SMS providers',
        error: error.message
      };
    }

    if (!providers || providers.length === 0) {
      return {
        success: false,
        step: 'SMS Provider',
        message: 'No enabled SMS providers found'
      };
    }

    const healthyProviders = providers.filter(p => p.health_status === 'healthy');
    if (healthyProviders.length === 0) {
      return {
        success: false,
        step: 'SMS Provider',
        message: 'No healthy SMS providers available',
        data: providers
      };
    }

    return {
      success: true,
      step: 'SMS Provider',
      message: `${healthyProviders.length} healthy provider(s) available`,
      data: providers
    };
  } catch (error: any) {
    return {
      success: false,
      step: 'SMS Provider',
      message: 'Test failed',
      error: error.message
    };
  }
}

/**
 * Test 6: Validate SMS Credits
 */
export async function testSMSCredits(tenantId: string): Promise<TestResult> {
  try {
    const { data: credits, error } = await supabase
      .from('sms_credits')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      return {
        success: false,
        step: 'SMS Credits',
        message: 'Failed to fetch SMS credits',
        error: error.message
      };
    }

    if (!credits || credits.balance <= 0) {
      return {
        success: false,
        step: 'SMS Credits',
        message: 'Insufficient SMS credits',
        data: credits
      };
    }

    return {
      success: true,
      step: 'SMS Credits',
      message: `${credits.balance} credits available`,
      data: credits
    };
  } catch (error: any) {
    return {
      success: false,
      step: 'SMS Credits',
      message: 'Test failed',
      error: error.message
    };
  }
}

/**
 * Run Complete System Test
 */
export async function runCompleteTest(qrToken: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: QR Generation
  const qrTest = await testQRGeneration(qrToken);
  results.push(qrTest);
  if (!qrTest.success) return results;

  // Test 2: Session Creation
  const sessionTest = await testSessionCreation(qrToken);
  results.push(sessionTest);
  if (!sessionTest.success) return results;

  const sessionData = sessionTest.data;

  // Test 3: Request Creation
  const requestTest = await testRequestCreation(sessionData.sessionId, sessionData.token);
  results.push(requestTest);

  // Test 4: SMS Template (non-blocking)
  const templateTest = await testSMSTemplate(sessionData.tenantId);
  results.push(templateTest);

  // Test 5: SMS Provider (non-blocking)
  const providerTest = await testSMSProvider();
  results.push(providerTest);

  // Test 6: SMS Credits (non-blocking)
  const creditsTest = await testSMSCredits(sessionData.tenantId);
  results.push(creditsTest);

  return results;
}
