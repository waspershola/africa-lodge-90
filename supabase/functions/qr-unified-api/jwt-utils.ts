// JWT utilities using Web Crypto API (no external dependencies)

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'default-secret-change-in-production';
const JWT_EXPIRY_HOURS = 24;

interface JWTPayload {
  session_id: string;
  tenant_id: string;
  qr_code_id: string;
  exp: number;
  iat: number;
}

function base64UrlEncode(data: string): string {
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(data: string): string {
  const padded = data.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded);
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );
  
  return base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );
}

export async function signJWT(payload: Omit<JWTPayload, 'exp' | 'iat'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + (JWT_EXPIRY_HOURS * 3600)
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(fullPayload));
  
  const signature = await hmacSign(`${headerEncoded}.${payloadEncoded}`, JWT_SECRET);
  
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const [headerEncoded, payloadEncoded, signature] = token.split('.');
    
    if (!headerEncoded || !payloadEncoded || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = await hmacSign(`${headerEncoded}.${payloadEncoded}`, JWT_SECRET);
    if (signature !== expectedSignature) {
      console.error('JWT signature verification failed');
      return null;
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as JWTPayload;
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.error('JWT token expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}
