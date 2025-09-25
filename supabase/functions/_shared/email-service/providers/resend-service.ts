import { EmailService, SendEmailParams, EmailResult } from '../types.ts';

export class ResendEmailService implements EmailService {
  private apiKey: string;
  private verifiedDomains: string[];

  constructor(config: { api_key: string; verified_domains: string[]; }) {
    this.apiKey = config.api_key;
    this.verifiedDomains = config.verified_domains || [];
  }

  getProviderName(): string {
    return 'resend';
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      const fromEmail = params.from || 'onboarding@resend.dev';
      const fromName = params.fromName || 'Hotel Management';
      const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: params.to,
          subject: params.subject,
          html: params.html,
          ...(params.text && { text: params.text }),
          ...(params.replyTo && { reply_to: params.replyTo }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API error: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        messageId: result.id,
        provider: 'resend',
      };
    } catch (error: any) {
      console.error('Resend Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email via Resend',
        provider: 'resend',
      };
    }
  }

  async verifyDomain(domain: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/domains', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domain }),
      });

      return response.ok;
    } catch (error) {
      console.error('Resend Domain Verification Error:', error);
      return false;
    }
  }
}