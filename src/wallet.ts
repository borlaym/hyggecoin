const EC = require('elliptic').ec;
const crypto = require('crypto');
const EdDSA = require('elliptic').eddsa;

/**
 * Generated context
 */

export function generateKeys(): { secretKey: string; publicKey: string } {
  const ec = new EC('secp256k1');
  const keyPair = ec.genKeyPair();
  const secretKey = keyPair.getPrivate().toString(16);
  const publicKey = keyPair.getPublic().encode('hex')
  return {
    secretKey,
    publicKey
  };
}

export function generateKeysFromPassword(password: string): { secretKey: string; publicKey: string } {
  const ec = new EdDSA('ed25519');
  const secret = crypto.createHash('sha256').update(password).digest('hex');
  const keyPair = ec.keyFromSecret(secret);
  const secretKey = keyPair.getSecret('hex');
  const publicKey = keyPair.getPublic('hex')

  return {
    secretKey,
    publicKey
  };
}