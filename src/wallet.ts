const EC = require('elliptic').ec;
const crypto = require('crypto');

/**
 * Generated context
 */

export function generateKeys(password?: string): { secretKey: string; publicKey: string } {
  const ec = new EC('secp256k1');
  const keyPair = ec.genKeyPair(password ? {
    entropy: crypto.createHash('sha256').update(password).digest('hex')
  } : undefined);
  const secretKey = keyPair.getPrivate().toString(16);
  const publicKey = keyPair.getPublic().encode('hex')
  return {
    secretKey,
    publicKey
  };
}