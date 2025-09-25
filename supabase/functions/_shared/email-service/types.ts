// Email service types for the shared email service

export interface EmailProviderConfig {
  default_provider: 'ses' | 'mailersend' | 'resend';
  fallback_enabled: boolean;
  fallback_provider: 'ses' | 'mailersend' | 'resend';
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
}

export interface EmailRequest {
  to: string[];
  subject: string;
  html: string;
  from: string;
  fromName: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  provider?: string;
  messageId?: string;
  error?: string;
  details?: any;
}