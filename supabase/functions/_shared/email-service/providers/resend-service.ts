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
      console.log('Resend: Starting email send...');
      const fromEmail = params.from || 'onboarding@resend.dev';
      const fromName = params.fromName || 'Hotel Management';
      
      // For Resend, we need to use a verified domain for the from address
      const verifiedFromEmail = this.verifiedDomains.length > 0 
        ? `noreply@${this.verifiedDomains[0]}` 
        : fromEmail;
      
      const from = fromName ? `${fromName} <${verifiedFromEmail}>` : verifiedFromEmail;

      console.log('Resend: Using from:', from);

      const requestBody = {
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        ...(params.text && { text: params.text }),
        ...(params.replyTo && { reply_to: params.replyTo }),
      };

      console.log('Resend: Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Resend: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resend: Error response:', errorText);
        
        let errorMessage = `Resend API error (${response.status}): ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          }
          // Add helpful context for common errors
          if (errorData.message && errorData.message.includes('domain')) {
            errorMessage += '\nNote: Make sure your from email domain is verified in your Resend account.';
          }
        } catch (parseError) {
          errorMessage += ` - ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Resend: Success response:', result);
      
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