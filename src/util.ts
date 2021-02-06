const crypto = require('crypto');

export function getHash(content: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(content);
  return hash.digest('hex');
}

export function toHexString(byteArray: any[]): string {
  return Array.from(byteArray, (byte: any) => {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
};