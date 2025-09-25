import { EmailService, SendEmailParams, EmailResult } from '../types.ts';

export class MailerSendEmailService implements EmailService {
  private apiKey: string;
  private verifiedDomains: string[];

  constructor(config: { api_key: string; verified_domains: string[]; }) {
    this.apiKey = config.api_key;
    this.verifiedDomains = config.verified_domains || [];
  }

  getProviderName(): string {
    return 'mailersend';
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      const fromEmail = params.from || 'noreply@example.com';
      const fromName = params.fromName || 'Hotel Management';

      const response = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: {
            email: fromEmail,
            name: fromName,
          },
          to: params.to.map(email => ({ email })),
          subject: params.subject,
          html: params.html,
          ...(params.text && { text: params.text }),
          ...(params.replyTo && { reply_to: { email: params.replyTo } }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MailerSend API error: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        messageId: result.message_id || result.id,
        provider: 'mailersend',
      };
    } catch (error: any) {
      console.error('MailerSend Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email via MailerSend',
        provider: 'mailersend',
      };
    }
  }

  async verifyDomain(domain: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.mailersend.com/v1/domains', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domain }),
      });

      return response.ok;
    } catch (error) {
      console.error('MailerSend Domain Verification Error:', error);
      return false;
    }
  }
}