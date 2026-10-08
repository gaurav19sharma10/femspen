/**
 * Web Crypto API utilities for 2FA PIN and Security Question hashing
 */

export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashString(value: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${value.trim().toLowerCase()}:${salt}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyHash(value: string, salt: string, expectedHash: string): Promise<boolean> {
  const computed = await hashString(value, salt);
  return computed.toLowerCase() === expectedHash.toLowerCase();
}
