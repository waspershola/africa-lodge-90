import { EmailService, SendEmailParams, EmailResult } from '../types.ts';

export class SesEmailService implements EmailService {
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private verifiedDomains: string[];

  constructor(config: {
    region: string;
    access_key_id: string;
    secret_access_key: string;
    verified_domains: string[];
  }) {
    this.region = config.region;
    this.accessKeyId = config.access_key_id;
    this.secretAccessKey = config.secret_access_key;
    this.verifiedDomains = config.verified_domains;
  }

  getProviderName(): string {
    return 'ses';
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      const { to, subject, html, text, from, fromName } = params;
      
      // Build the from address with name if provided
      const fromAddress = fromName ? `${fromName} <${from}>` : from;
      
      const payload = {
        Destination: {
          ToAddresses: to
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: html
            },
            ...(text && {
              Text: {
                Charset: 'UTF-8',
                Data: text
              }
            })
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject
          }
        },
        Source: fromAddress
      };

      const response = await this.makeAwsRequest('SendEmail', payload);
      
      if (response.MessageId) {
        return {
          success: true,
          messageId: response.MessageId,
          provider: 'ses'
        };
      } else {
        throw new Error('No MessageId returned from SES');
      }
    } catch (error) {
      console.error('SES send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        provider: 'ses'
      };
    }
  }

  async verifyDomain(domain: string): Promise<boolean> {
    try {
      const payload = { Domain: domain };
      await this.makeAwsRequest('VerifyDomainIdentity', payload);
      return true;
    } catch (error) {
      console.error('SES domain verification error:', error);
      return false;
    }
  }

  private async makeAwsRequest(action: string, payload: any) {
    const host = `email.${this.region}.amazonaws.com`;
    const endpoint = `https://${host}/`;
    
    const now = new Date();
    const dateString = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeString = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
    
    const canonicalHeaders = `host:${host}\nx-amz-date:${timeString}\n`;
    const signedHeaders = 'host;x-amz-date';
    
    const payloadHash = await this.sha256(JSON.stringify(payload));
    const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateString}/${this.region}/email/aws4_request`;
    const stringToSign = `${algorithm}\n${timeString}\n${credentialScope}\n${await this.sha256(canonicalRequest)}`;
    
    const signature = await this.getSignature(dateString, stringToSign);
    const authorization = `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    const headers = {
      'Content-Type': 'application/x-amz-json-1.0',
      'X-Amz-Target': `AWSSimpleEmailService.${action}`,
      'X-Amz-Date': timeString,
      'Authorization': authorization
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(`SES API error: ${response.status} ${responseText}`);
    }
    
    return JSON.parse(responseText);
  }

  private async sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async getSignature(dateString: string, stringToSign: string): Promise<string> {
    const kDate = await this.hmac(`AWS4${this.secretAccessKey}`, dateString);
    const kRegion = await this.hmac(kDate, this.region);
    const kService = await this.hmac(kRegion, 'email');
    const kSigning = await this.hmac(kService, 'aws4_request');
    const signature = await this.hmac(kSigning, stringToSign);
    
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async hmac(key: string | ArrayBuffer, message: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const keyData = typeof key === 'string' ? encoder.encode(key) : key;
    const messageData = encoder.encode(message);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    return await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  }
}