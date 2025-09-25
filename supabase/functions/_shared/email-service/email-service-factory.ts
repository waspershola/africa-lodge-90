import { EmailService, EmailProviderConfig, SendEmailParams, EmailResult, EmailLogEntry } from './types.ts';
import { SesEmailService } from './providers/ses-service.ts';
import { MailerSendEmailService } from './providers/mailersend-service.ts';
import { ResendEmailService } from './providers/resend-service.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export class EmailServiceFactory {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
  }

  createEmailService(config: EmailProviderConfig, provider?: string): EmailService | null {
    const targetProvider = provider || config.default_provider;
    
    switch (targetProvider) {
      case 'ses':
        if (config.providers.ses.enabled && config.providers.ses.access_key_id && config.providers.ses.secret_access_key) {
          return new SesEmailService(config.providers.ses);
        }
        break;
      
      case 'mailersend':
        if (config.providers.mailersend.enabled && config.providers.mailersend.api_key) {
          return new MailerSendEmailService(config.providers.mailersend);
        }
        break;
      
      case 'resend':
        if (config.providers.resend.enabled && config.providers.resend.api_key) {
          return new ResendEmailService(config.providers.resend);
        }
        break;
    }
    
    return null;
  }

  async sendEmailWithFallback(
    tenantId: string, 
    config: EmailProviderConfig, 
    params: SendEmailParams,
    emailType: string = 'notification'
  ): Promise<EmailResult> {
    // Try primary provider
    const primaryService = this.createEmailService(config);
    if (primaryService) {
      const result = await this.sendWithLogging(tenantId, primaryService, params, emailType);
      if (result.success) {
        return result;
      }
      
      console.log(`Primary provider ${config.default_provider} failed:`, result.error);
    }

    // Try fallback if enabled
    if (config.fallback_enabled && config.fallback_provider !== config.default_provider) {
      const fallbackService = this.createEmailService(config, config.fallback_provider);
      if (fallbackService) {
        console.log(`Attempting fallback with ${config.fallback_provider}`);
        const result = await this.sendWithLogging(tenantId, fallbackService, params, emailType);
        return result;
      }
    }

    // All providers failed
    const failureResult: EmailResult = {
      success: false,
      error: 'All email providers failed or are not configured',
      provider: 'none'
    };

    await this.logEmailAttempt(tenantId, {
      tenant_id: tenantId,
      provider: 'fallback_failed',
      email_type: emailType,
      recipient_email: params.to.join(', '),
      subject: params.subject,
      status: 'failed',
      error_message: failureResult.error,
      metadata: { attempted_providers: [config.default_provider, config.fallback_provider] }
    });

    return failureResult;
  }

  private async sendWithLogging(
    tenantId: string,
    service: EmailService,
    params: SendEmailParams,
    emailType: string
  ): Promise<EmailResult> {
    const startTime = Date.now();
    
    try {
      const result = await service.sendEmail(params);
      
      await this.logEmailAttempt(tenantId, {
        tenant_id: tenantId,
        provider: service.getProviderName(),
        email_type: emailType,
        recipient_email: params.to.join(', '),
        subject: params.subject,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error,
        sent_at: result.success ? new Date().toISOString() : undefined,
        metadata: {
          message_id: result.messageId,
          duration_ms: Date.now() - startTime,
          recipients_count: params.to.length
        }
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      await this.logEmailAttempt(tenantId, {
        tenant_id: tenantId,
        provider: service.getProviderName(),
        email_type: emailType,
        recipient_email: params.to.join(', '),
        subject: params.subject,
        status: 'failed',
        error_message: errorMessage,
        metadata: {
          duration_ms: Date.now() - startTime,
          recipients_count: params.to.length
        }
      });

      return {
        success: false,
        error: errorMessage,
        provider: service.getProviderName()
      };
    }
  }

  private async logEmailAttempt(tenantId: string, logEntry: EmailLogEntry): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('email_provider_logs')
        .insert(logEntry);
      
      if (error) {
        console.error('Failed to log email attempt:', error);
      }
    } catch (error) {
      console.error('Error logging email attempt:', error);
    }
  }

  async getEmailProviderConfig(tenantId: string): Promise<EmailProviderConfig | null> {
    try {
      const { data, error } = await this.supabase
        .from('hotel_settings')
        .select('email_provider_config')
        .eq('tenant_id', tenantId)
        .single();

      if (error || !data?.email_provider_config) {
        console.error('Failed to get email provider config:', error);
        return null;
      }

      return data.email_provider_config as EmailProviderConfig;
    } catch (error) {
      console.error('Error getting email provider config:', error);
      return null;
    }
  }
}