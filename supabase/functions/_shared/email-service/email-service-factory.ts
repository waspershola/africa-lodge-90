// Email service factory for handling multiple email providers

import { EmailProviderConfig, EmailRequest, EmailResult } from './types.ts';

export class EmailServiceFactory {
  async sendEmailWithFallback(
    tenantId: string,
    config: EmailProviderConfig,
    emailRequest: EmailRequest,
    emailType: string
  ): Promise<EmailResult> {
    const primaryProvider = config.default_provider;
    
    console.log(`Attempting to send email via primary provider: ${primaryProvider}`);
    
    // Try primary provider first
    const result = await this.sendWithProvider(primaryProvider, config, emailRequest);
    
    if (result.success) {
      console.log(`Email sent successfully via ${primaryProvider}`);
      return result;
    }
    
    console.log(`Primary provider ${primaryProvider} failed: ${result.error}`);
    
    // Try fallback providers if enabled
    if (config.fallback_enabled && config.fallback_provider !== primaryProvider) {
      console.log(`Trying fallback provider: ${config.fallback_provider}`);
      const fallbackResult = await this.sendWithProvider(config.fallback_provider, config, emailRequest);
      
      if (fallbackResult.success) {
        console.log(`Email sent successfully via fallback provider: ${config.fallback_provider}`);
        return fallbackResult;
      }
      
      console.log(`Fallback provider ${config.fallback_provider} also failed: ${fallbackResult.error}`);
    }
    
    return {
      success: false,
      error: 'All email providers failed or are not configured',
      provider: 'none'
    };
  }

  private async sendWithProvider(
    provider: 'ses' | 'mailersend' | 'resend',
    config: EmailProviderConfig,
    emailRequest: EmailRequest
  ): Promise<EmailResult> {
    const providerConfig = config.providers[provider];
    
    if (!providerConfig.enabled) {
      return {
        success: false,
        error: `${provider.toUpperCase()} provider is not enabled`,
        provider
      };
    }
    
    try {
      switch (provider) {
        case 'resend':
          return await this.sendWithResend(providerConfig, emailRequest);
        case 'mailersend':
          return await this.sendWithMailerSend(providerConfig, emailRequest);
        case 'ses':
          return await this.sendWithSES(providerConfig, emailRequest);
        default:
          return {
            success: false,
            error: `Unsupported provider: ${provider}`,
            provider
          };
      }
    } catch (error) {
      console.error(`${provider} Error:`, error);
      return {
        success: false,
        error: `${provider.toUpperCase()} Error: ${error instanceof Error ? error.message : String(error)}`,
        provider,
        details: error instanceof Error ? error.stack : error
      };
    }
  }

  private async sendWithResend(config: any, emailRequest: EmailRequest): Promise<EmailResult> {
    console.log('Resend: Starting email send...');
    
    if (!config.api_key) {
      return {
        success: false,
        error: 'Resend API key is not configured',
        provider: 'resend'
      };
    }

    // Use the verified onboarding@resend.dev for testing
    const fromEmail = emailRequest.from === 'noreply@example.com' ? 'onboarding@resend.dev' : emailRequest.from;
    const fromHeader = `${emailRequest.fromName} <${fromEmail}>`;
    
    console.log('Resend: Using from:', fromHeader);

    const payload = {
      from: fromHeader,
      to: emailRequest.to,
      subject: emailRequest.subject,
      html: emailRequest.html
    };

    console.log('Resend: Request body:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Resend: Response status:', response.status);
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Resend: Error response:', responseData);
      throw new Error(`Resend API error (${response.status}): ${response.statusText} - ${responseData.message || 'Unknown error'}\nNote: Make sure your from email domain is verified in your Resend account.`);
    }

    console.log('Resend: Success response:', responseData);
    
    return {
      success: true,
      provider: 'resend',
      messageId: responseData.id
    };
  }

  private async sendWithMailerSend(config: any, emailRequest: EmailRequest): Promise<EmailResult> {
    console.log('MailerSend: Starting email send...');
    
    if (!config.api_key) {
      return {
        success: false,
        error: 'MailerSend API key is not configured',
        provider: 'mailersend'
      };
    }

    console.log('MailerSend: Using from email:', emailRequest.from);

    const payload = {
      from: {
        email: emailRequest.from,
        name: emailRequest.fromName
      },
      to: emailRequest.to.map(email => ({ email })),
      subject: emailRequest.subject,
      html: emailRequest.html
    };

    console.log('MailerSend: Request body:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('MailerSend: Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('MailerSend: Error response:', errorData);
      throw new Error(`MailerSend API error (${response.status}): ${response.statusText} - ${errorData.message || 'Unknown error'}\nNote: The from email domain must be verified in your MailerSend account.`);
    }

    const responseData = await response.json();
    console.log('MailerSend: Success response:', responseData);
    
    return {
      success: true,
      provider: 'mailersend',
      messageId: responseData.id || 'unknown'
    };
  }

  private async sendWithSES(config: any, emailRequest: EmailRequest): Promise<EmailResult> {
    console.log('SES: Starting email send process...');
    
    if (!config.access_key_id || !config.secret_access_key) {
      return {
        success: false,
        error: 'SES credentials are not configured',
        provider: 'ses'
      };
    }

    const sourceEmail = `${emailRequest.fromName} <${emailRequest.from}>`;
    console.log('SES: Using source email:', sourceEmail);

    // Create the SES client and send email
    const { SESClient, SendEmailCommand } = await import('https://esm.sh/@aws-sdk/client-ses@3.896.0');
    
    console.log('Creating SES service...');
    const sesClient = new SESClient({
      region: config.region || 'eu-north-1',
      credentials: {
        accessKeyId: config.access_key_id,
        secretAccessKey: config.secret_access_key,
      },
    });

    console.log('SES Service initialized:', {
      region: config.region || 'eu-north-1',
      hasAccessKey: !!config.access_key_id,
      hasSecretKey: !!config.secret_access_key,
      verifiedDomains: config.verified_domains?.length || 0
    });

    const command = new SendEmailCommand({
      Source: sourceEmail,
      Destination: {
        ToAddresses: emailRequest.to,
      },
      Message: {
        Subject: {
          Data: emailRequest.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: emailRequest.html,
            Charset: 'UTF-8',
          },
        },
      },
    });

    console.log('SES: Making API request to:', `https://email.${config.region || 'eu-north-1'}.amazonaws.com/`);
    
    try {
      const result = await sesClient.send(command);
      console.log('SES: Email sent successfully:', result.MessageId);
      
      return {
        success: true,
        provider: 'ses',
        messageId: result.MessageId
      };
    } catch (error: any) {
      console.error('SES: Error response:', error.message);
      throw new Error(`SES Error: ${error.name} - ${error.message}\nNote: Make sure your from email address is verified in AWS SES.`);
    }
  }

  async sendWithLogging(
    provider: string,
    emailRequest: EmailRequest,
    config: any
  ): Promise<EmailResult> {
    console.log(`Attempting to send email via ${provider}...`);
    
    try {
      let result: EmailResult;
      
      switch (provider) {
        case 'resend':
          result = await this.sendWithResend(config, emailRequest);
          break;
        case 'mailersend':
          result = await this.sendWithMailerSend(config, emailRequest);
          break;
        case 'ses':
          result = await this.sendWithSES(config, emailRequest);
          break;
        default:
          result = {
            success: false,
            error: `Unsupported provider: ${provider}`,
            provider
          };
      }
      
      if (result.success) {
        console.log(`Email sent successfully via ${provider}`);
      } else {
        console.log(`Primary provider ${provider} failed: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`${provider} Error:`, error);
      
      return {
        success: false,
        error: errorMessage,
        provider,
        details: error instanceof Error ? error.stack : error
      };
    }
  }

  async getEmailProviderConfig(tenantId: string): Promise<EmailProviderConfig | null> {
    // For now, return a basic config using environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.log('No RESEND_API_KEY found in environment');
      return null;
    }
    
    return {
      default_provider: 'resend',
      fallback_enabled: false,
      fallback_provider: 'resend',
      providers: {
        ses: {
          enabled: false,
          region: 'eu-north-1',
          access_key_id: '',
          secret_access_key: '',
          verified_domains: []
        },
        mailersend: {
          enabled: false,
          api_key: '',
          verified_domains: []
        },
        resend: {
          enabled: true,
          api_key: resendApiKey,
          verified_domains: []
        }
      }
    };
  }
}