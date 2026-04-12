/**
 * Hashes a password using SHA-256 with a system salt and the email as a secondary salt.
 * Matches the hashing logic used in the legacy SmartLMS system (core.js).
 */
export async function hashPassword(password: string, email: string): Promise<string> {
  const encoder = new TextEncoder();
  const systemSalt = 'smart-lms-v1-';
  const salt = email.toLowerCase().trim();

  // Logic from legacy core.js: systemSalt + salt + password
  const data = encoder.encode(systemSalt + salt + password);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

const SESSION_SECRET = 'smart-lms-v1-session-secret-key-high-entropy';

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
