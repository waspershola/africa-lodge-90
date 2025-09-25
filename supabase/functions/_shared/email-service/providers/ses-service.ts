import { EmailService, SendEmailParams, EmailResult } from '../types.ts';

export class SesEmailService implements EmailService {
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private verifiedDomains: string[];

  constructor(config: { region: string; access_key_id: string; secret_access_key: string; verified_domains: string[]; }) {
    this.region = config.region;
    this.accessKeyId = config.access_key_id;
    this.secretAccessKey = config.secret_access_key;
    this.verifiedDomains = config.verified_domains || [];
    
    console.log('SES Service initialized:', {
      region: this.region,
      hasAccessKey: !!this.accessKeyId,
      hasSecretKey: !!this.secretAccessKey,
      verifiedDomains: this.verifiedDomains.length
    });
  }

  getProviderName(): string {
    return 'ses';
  }

  private async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async hmacSha256(key: string, message: string): Promise<ArrayBuffer> {
    const keyBuffer = new TextEncoder().encode(key);
    const messageBuffer = new TextEncoder().encode(message);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
  }

  private async getSignature(stringToSign: string, dateStamp: string): Promise<string> {
    const kDate = await this.hmacSha256(`AWS4${this.secretAccessKey}`, dateStamp);
    const kRegion = await crypto.subtle.sign('HMAC', 
      await crypto.subtle.importKey('raw', kDate, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      new TextEncoder().encode(this.region)
    );
    const kService = await crypto.subtle.sign('HMAC',
      await crypto.subtle.importKey('raw', kRegion, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      new TextEncoder().encode('ses')
    );
    const kSigning = await crypto.subtle.sign('HMAC',
      await crypto.subtle.importKey('raw', kService, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      new TextEncoder().encode('aws4_request')
    );
    const signature = await crypto.subtle.sign('HMAC',
      await crypto.subtle.importKey('raw', kSigning, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      new TextEncoder().encode(stringToSign)
    );
    
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      console.log('SES: Starting email send process...');
      
      const fromEmail = params.from || 'noreply@example.com';
      const fromName = params.fromName || 'Hotel Management';
      const source = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

      // Use verified domain if available
      const finalFromEmail = this.verifiedDomains.length > 0 
        ? `noreply@${this.verifiedDomains[0]}`
        : fromEmail;
      const finalSource = fromName ? `${fromName} <${finalFromEmail}>` : finalFromEmail;

      console.log('SES: Using source email:', finalSource);

      const endpoint = `https://email.${this.region}.amazonaws.com/`;
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
      const dateStamp = timestamp.slice(0, 8);

      // Build form data
      const formData = new URLSearchParams();
      formData.append('Action', 'SendEmail');
      formData.append('Version', '2010-12-01');
      formData.append('Source', finalSource);
      formData.append('Message.Subject.Data', params.subject);
      formData.append('Message.Subject.Charset', 'UTF-8');
      formData.append('Message.Body.Html.Data', params.html);
      formData.append('Message.Body.Html.Charset', 'UTF-8');
      
      params.to.forEach((email, index) => {
        formData.append(`Destination.ToAddresses.member.${index + 1}`, email);
      });

      if (params.text) {
        formData.append('Message.Body.Text.Data', params.text);
        formData.append('Message.Body.Text.Charset', 'UTF-8');
      }

      if (params.replyTo) {
        formData.append('ReplyToAddresses.member.1', params.replyTo);
      }

      const body = formData.toString();
      const payloadHash = await this.sha256(body);

      // Create canonical request
      const canonicalUri = '/';
      const canonicalQuerystring = '';
      const canonicalHeaders = [
        `host:email.${this.region}.amazonaws.com`,
        `x-amz-date:${timestamp}`
      ].join('\n') + '\n';
      const signedHeaders = 'host;x-amz-date';

      const canonicalRequest = [
        'POST',
        canonicalUri,
        canonicalQuerystring,
        canonicalHeaders,
        signedHeaders,
        payloadHash
      ].join('\n');

      // Create string to sign
      const algorithm = 'AWS4-HMAC-SHA256';
      const credentialScope = `${dateStamp}/${this.region}/ses/aws4_request`;
      const stringToSign = [
        algorithm,
        timestamp,
        credentialScope,
        await this.sha256(canonicalRequest)
      ].join('\n');

      // Calculate signature
      const signature = await this.getSignature(stringToSign, dateStamp);

      // Create authorization header
      const authorizationHeader = `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

      console.log('SES: Making API request to:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Amz-Date': timestamp,
          'Authorization': authorizationHeader,
          'Host': `email.${this.region}.amazonaws.com`
        },
        body
      });

      console.log('SES: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SES: Error response:', errorText);
        
        let errorMessage = `SES API error (${response.status}): ${response.statusText}`;
        
        // Parse XML error for better messages
        if (errorText.includes('<Code>')) {
          const codeMatch = errorText.match(/<Code>([^<]+)<\/Code>/);
          const messageMatch = errorText.match(/<Message>([^<]+)<\/Message>/);
          if (codeMatch && messageMatch) {
            errorMessage = `SES Error: ${codeMatch[1]} - ${messageMatch[1]}`;
          }
        }
        
        if (errorText.includes('MessageRejected')) {
          errorMessage += '\nNote: Make sure your from email address is verified in AWS SES.';
        }
        
        if (errorText.includes('SendingPausedException')) {
          errorMessage += '\nNote: Your AWS SES account sending is paused.';
        }

        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log('SES: Success response received');

      // Parse XML response to get MessageId
      const messageIdMatch = responseText.match(/<MessageId>([^<]+)<\/MessageId>/);
      const messageId = messageIdMatch ? messageIdMatch[1] : undefined;

      return {
        success: true,
        messageId,
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
      return this.verifiedDomains.includes(domain);
    } catch (error) {
      console.error('SES Domain Verification Error:', error);
      return false;
    }
  }
}