export interface EmailService {
  sendEmail(params: SendEmailParams): Promise<EmailResult>;
  verifyDomain?(domain: string): Promise<boolean>;
  getProviderName(): string;
}

export interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface EmailProviderConfig {
  default_provider: 'ses' | 'mailersend' | 'resend';
  providers: {
    ses: {
      enabled: boolean;
      region: string;
      access_key_id: string;
      secret_access_key: string;
      verified_domains: string[];
    };
    mailersend: {
      enabled: boolean;
      api_key: string;
      verified_domains: string[];
    };
    resend: {
      enabled: boolean;
      api_key: string;
      verified_domains: string[];
    };
  };
  fallback_enabled: boolean;
  fallback_provider: 'ses' | 'mailersend' | 'resend';
}

export interface EmailLogEntry {
  tenant_id: string;
  provider: string;
  email_type: string;
  recipient_email: string;
  subject?: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at?: string;
  metadata?: Record<string, any>;
}