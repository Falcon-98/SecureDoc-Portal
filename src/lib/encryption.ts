// Encryption key for XOR cipher (same pattern as original)
const ENCRYPTION_KEY = [0x5A, 0x3F, 0x7C, 0x1D, 0xA2, 0x6B, 0x9E, 0x04, 0xF1, 0x38, 0xC7, 0x55, 0x8D, 0x2A, 0xE6, 0x73];

/**
 * Encrypts a string using XOR cipher
 */
export function encryptUrl(url: string): number[] {
  const encrypted: number[] = [];
  for (let i = 0; i < url.length; i++) {
    encrypted.push(url.charCodeAt(i) ^ ENCRYPTION_KEY[i % ENCRYPTION_KEY.length]);
  }
  return encrypted;
}

/**
 * Decrypts an XOR-encrypted array back to string
 */
export function decryptUrl(encrypted: number[]): string {
  return encrypted
    .map((byte, i) => String.fromCharCode(byte ^ ENCRYPTION_KEY[i % ENCRYPTION_KEY.length]))
    .join('');
}

/**
 * Converts encrypted array to base64 for storage
 */
export function encryptedToBase64(encrypted: number[]): string {
  return Buffer.from(encrypted).toString('base64');
}

/**
 * Converts base64 string back to encrypted array
 */
export function base64ToEncrypted(base64: string): number[] {
  const buffer = Buffer.from(base64, 'base64');
  return Array.from(buffer);
}
