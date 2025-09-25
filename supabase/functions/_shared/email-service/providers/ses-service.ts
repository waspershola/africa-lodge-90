import { EmailService, SendEmailParams, EmailResult } from '../types.ts';
import { SESClient, SendEmailCommand } from 'https://esm.sh/@aws-sdk/client-ses@3.896.0';

export class SesEmailService implements EmailService {
  private client: SESClient;
  private verifiedDomains: string[];

  constructor(config: { region: string; access_key_id: string; secret_access_key: string; verified_domains: string[]; }) {
    this.client = new SESClient({
      region: config.region,
      credentials: {
        accessKeyId: config.access_key_id,
        secretAccessKey: config.secret_access_key,
      },
      // Explicitly disable loading config from files in Deno environment
      useFipsEndpoint: false,
      useDualstackEndpoint: false,
      maxAttempts: 3,
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

      const command = new SendEmailCommand({
        Source: source,
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

      const response = await this.client.send(command);
      
      return {
        success: true,
        messageId: response.MessageId,
        provider: 'ses',
      };
    } catch (error: any) {
      console.error('SES Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email via SES',
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