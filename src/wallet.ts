import { getHash } from "./util";

const EC = require('elliptic').ec;
const crypto = require('crypto');

const SALT = '&)(*&#$&*oh my god what a salt this is,;[]0=-0-=0_+;``';

type Wallet = {
  publicKey: string;
  secretKey: string;
  name: string;
  passwordHash: string;
  tokens: string[]
}

let wallets: Wallet[] = [];

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

export function createWallet(name: string, password: string) {
  const { publicKey, secretKey } = generateKeys();
  wallets = [...wallets, {
    publicKey,
    secretKey,
    name,
    passwordHash: getHash(name + password + SALT),
    tokens: []
  }]
}

export function getToken(name: string, password: string): string | false {
  const wallet = wallets.find(wallet => wallet.name === name);
  if (wallet.passwordHash !== getHash(name + password + SALT)) {
    return false;
  }
  const token = getHash(Date.now() + name + password);
  wallets[wallets.indexOf(wallet)] = {
    ...wallet,
    tokens: [...wallet.tokens, token]
  };
  return token;
}

export function authenticate(name: string, token: string): boolean {
  const wallet = wallets.find(wallet => wallet.name === name);
  return wallet.tokens.includes(token);
}