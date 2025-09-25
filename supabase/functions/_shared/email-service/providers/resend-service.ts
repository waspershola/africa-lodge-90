import { EmailService, SendEmailParams, EmailResult } from '../types.ts';

export class ResendEmailService implements EmailService {
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
    return 'resend';
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      const { to, subject, html, text, from, fromName, replyTo } = params;
      
      // Build the from address with name if provided
      const fromAddress = fromName ? `${fromName} <${from}>` : from;
      
      const payload = {
        from: fromAddress,
        to,
        subject,
        html,
        ...(text && { text }),
        ...(replyTo && { reply_to: replyTo })
      };

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: responseData.id,
          provider: 'resend'
        };
      } else {
        throw new Error(`Resend API error: ${response.status} ${JSON.stringify(responseData)}`);
      }
    } catch (error) {
      console.error('Resend send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        provider: 'resend'
      };
    }
  }

  async verifyDomain(domain: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/domains', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: domain })
      });

      return response.ok;
    } catch (error) {
      console.error('Resend domain verification error:', error);
      return false;
    }
  }
}