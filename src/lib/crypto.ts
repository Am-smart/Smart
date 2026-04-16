import bcrypt from 'bcryptjs';

/**
 * Hashes a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plain text password with a bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// In production, SESSION_SECRET MUST be set as an environment variable.
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-secret-do-not-use-in-production-1234567890';

export async function signData(data: object): Promise<string> {
    const encoder = new TextEncoder();
    const payload = JSON.stringify(data);
    const secret = encoder.encode(SESSION_SECRET);
    const key = await crypto.subtle.importKey(
        'raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const signatureHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return `${btoa(payload)}.${signatureHex}`;
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
    try {
        const [encodedPayload, signatureHex] = token.split('.');
        const payload = atob(encodedPayload);
        const encoder = new TextEncoder();
        const secret = encoder.encode(SESSION_SECRET);
        const key = await crypto.subtle.importKey(
            'raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
        );

        const sigArray = new Uint8Array(signatureHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        const isValid = await crypto.subtle.verify('HMAC', key, sigArray, encoder.encode(payload));

        return isValid ? JSON.parse(payload) : null;
    } catch {
        return null;
    }
}
