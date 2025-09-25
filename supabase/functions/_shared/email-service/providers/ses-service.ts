import { EmailService, SendEmailParams, EmailResult } from '../types.ts';

// Use AWS SDK directly but with proper Deno configuration
import { SESClient, SendEmailCommand } from 'https://esm.sh/@aws-sdk/client-ses@3.896.0?target=deno';

export class SesEmailService implements EmailService {
  private client: SESClient;
  private verifiedDomains: string[];

  constructor(config: { region: string; access_key_id: string; secret_access_key: string; verified_domains: string[]; }) {
    // Configure SES client with explicit Deno-compatible settings
    this.client = new SESClient({
      region: config.region,
      credentials: {
        accessKeyId: config.access_key_id,
        secretAccessKey: config.secret_access_key,
      },
      // Disable default config file loading for Deno
      defaultsMode: 'standard',
      requestHandler: {
        requestTimeout: 30000,
        httpsAgent: undefined,
        httpAgent: undefined,
      },
    });
    this.verifiedDomains = config.verified_domains || [];
  }

  getProviderName(): string {
    return 'ses';
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      const fromEmail = params.from || 'noreply@example.com';
      const fromName = params.fromName || 'Hotel Management';
      const source = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

      // Use verified domain if available
      const finalFromEmail = this.verifiedDomains.length > 0 
        ? `noreply@${this.verifiedDomains[0]}`
        : fromEmail;
      const finalSource = fromName ? `${fromName} <${finalFromEmail}>` : finalFromEmail;

      const command = new SendEmailCommand({
        Source: finalSource,
        Destination: {
          ToAddresses: params.to,
        },
        Message: {
          Subject: {
            Data: params.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: params.html,
              Charset: 'UTF-8',
            },
            ...(params.text && {
              Text: {
                Data: params.text,
                Charset: 'UTF-8',
              },
            }),
          },
        },
        ...(params.replyTo && {
          ReplyToAddresses: [params.replyTo],
        }),
      });

      console.log('Sending SES email with command:', {
        Source: finalSource,
        Destination: params.to,
        Subject: params.subject
      });

      const response = await this.client.send(command);
      
      console.log('SES email sent successfully:', response.MessageId);
      
      return {
        success: true,
        messageId: response.MessageId,
        provider: 'ses',
      };
    } catch (error: any) {
      console.error('SES Error:', error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Failed to send email via SES';
      
      if (error.name === 'MessageRejected') {
        errorMessage += '\nNote: Make sure your from email address is verified in AWS SES.';
      }
      
      if (error.name === 'SendingPausedException') {
        errorMessage += '\nNote: Your AWS SES account sending is paused.';
      }
      
      return {
        success: false,
        error: errorMessage,
        provider: 'ses',
      };
    }
  }

  async verifyDomain(domain: string): Promise<boolean> {
    try {
      // This would typically involve SES domain verification API calls
      // For now, we'll check if it's in our verified domains list
      return this.verifiedDomains.includes(domain);
    } catch (error) {
      console.error('SES Domain Verification Error:', error);
      return false;
    }
  }
}