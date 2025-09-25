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
      console.log('MailerSend: Starting email send...');
      const fromEmail = params.from || 'noreply@example.com';
      const fromName = params.fromName || 'Hotel Management';

      // For MailerSend, we need to use a verified domain for the from address
      // If using trial account, it must be from a verified domain
      const verifiedFromEmail = this.verifiedDomains.length > 0 
        ? `noreply@${this.verifiedDomains[0]}` 
        : fromEmail;

      console.log('MailerSend: Using from email:', verifiedFromEmail);

      const requestBody = {
        from: {
          email: verifiedFromEmail,
          name: fromName,
        },
        to: params.to.map(email => ({ email })),
        subject: params.subject,
        html: params.html,
        ...(params.text && { text: params.text }),
        ...(params.replyTo && { reply_to: { email: params.replyTo } }),
      };

      console.log('MailerSend: Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(requestBody),
      });

      console.log('MailerSend: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MailerSend: Error response:', errorText);
        
        let errorMessage = `MailerSend API error (${response.status}): ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          }
          // Add helpful context for common errors
          if (errorData.errors) {
            if (errorData.errors.to && errorData.errors.to.some((e: string) => e.includes('trial account'))) {
              errorMessage += '\nNote: Trial accounts can only send emails to verified email addresses.';
            }
            if (errorData.errors['from.email'] && errorData.errors['from.email'].some((e: string) => e.includes('verified'))) {
              errorMessage += '\nNote: The from email domain must be verified in your MailerSend account.';
            }
          }
        } catch (parseError) {
          errorMessage += ` - ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('MailerSend: Success response:', result);
      
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