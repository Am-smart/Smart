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
