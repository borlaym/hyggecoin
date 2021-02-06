const EC = require('elliptic').ec;

/**
 * Generated context
 */
var ec = new EC('secp256k1');

export function generateKeys(): { secretKey: string; publicKey: string } {
  const keyPair = ec.genKeyPair();
  const secretKey = keyPair.getPrivate().toString(16);
  const publicKey = keyPair.getPublic().encode('hex')
  return {
    secretKey,
    publicKey
  };
}