import { EmailService, SendEmailParams, EmailResult } from '../types.ts';

export class MailerSendEmailService implements EmailService {
  private apiKey: string;
  private verifiedDomains: string[];

  constructor(config: {
    api_key: string;
    verified_domains: string[];
  }) {
    this.apiKey = config.api_key;
    this.verifiedDomains = config.verified_domains;
  }

  getProviderName(): string {
    return 'mailersend';
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      const { to, subject, html, text, from, fromName, replyTo } = params;
      
      const payload = {
        from: {
          email: from,
          name: fromName || 'Hotel Notification'
        },
        to: to.map(email => ({ email })),
        subject,
        html,
        ...(text && { text }),
        ...(replyTo && { reply_to: [{ email: replyTo }] })
      };

      const response = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: responseData.message_id || 'mailersend_' + Date.now(),
          provider: 'mailersend'
        };
      } else {
        throw new Error(`MailerSend API error: ${response.status} ${JSON.stringify(responseData)}`);
      }
    } catch (error) {
      console.error('MailerSend send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        provider: 'mailersend'
      };
    }
  }

  async verifyDomain(domain: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.mailersend.com/v1/domains', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: domain })
      });

      return response.ok;
    } catch (error) {
      console.error('MailerSend domain verification error:', error);
      return false;
    }
  }
}