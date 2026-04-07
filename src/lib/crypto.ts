/**
 * Hashes a password using SHA-256 with the email as salt.
 * Matches the hashing logic used in the legacy SmartLMS system.
 */
export async function hashPassword(password: string, email: string): Promise<string> {
  const encoder = new TextEncoder();
  // Standardize salt to lowercase and trimmed email as used in original core.js
  const salt = email.toLowerCase().trim();
  const data = encoder.encode(password + salt);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
