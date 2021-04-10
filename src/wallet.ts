import firebase from "./firebase";
import { getHash } from "./util";

const EC = require('elliptic').ec;
const crypto = require('crypto');

/**
 * Salt is appended to the end of passwords before a hash is calculated
 */
const SALT = process.env.SALT;

const walletRef = firebase.ref('/wallets');

/**
 * A wallet is for making it easier for users to manage transactions for a given public address
 */
export type Wallet = {
  /**
   * Public part if the cryptographic keypair. This is the address where users can send coins, and used for validating transactions
   */
  publicKey: string;
  /**
   * Private part of the cryptographic pair. Used for signing transactions
   */
  secretKey: string;
  /**
   * An easy to remember name for the wallet
   */
  name?: string;
  /**
   * Hash of the password string for logging into the wallet. Gets calculated as hash(name + password + salt)
   */
  passwordHash?: string;
  /**
   * Tokens for quick access to the wallet, sent as Bearer tokens in Authorization headers
   */
  tokens: string[];
  /**
   * Slack id of the user associated with the wallet
   * When slack makes a POST request, a wallet can be selected based on this id
   */
  slackId?: string;
}

/**
 * Get all wallets from firebase with ids intact
 */
function getAllWalletsWithReferences(): Promise<{ [key: string]: Wallet }> {
  return walletRef.get().then(snapshot => {
    const data: { [key: string]: Wallet } = snapshot.val() || {};
    return data;
  });
}

/**
 * Fetch all wallets
 */
export function getAllWallets(): Promise<Wallet[]> {
  return getAllWalletsWithReferences().then(results => Object.values(results) || []);
}

/**
 * Generate a random public / secret keypair.
 * Optionally accepts a seed to deterministically generate a pair, but this should ONLY be used for unit testing!
 */
export function generateKeys(seed?: string): { secretKey: string; publicKey: string } {
  const ec = new EC('secp256k1');
  const keyPair = ec.genKeyPair(seed ? {
    entropy: crypto.createHash('sha256').update(seed).digest('hex')
  } : undefined);
  const secretKey = keyPair.getPrivate().toString(16);
  const publicKey = keyPair.getPublic().encode('hex')
  return {
    secretKey,
    publicKey
  };
}

/**
 * Creates a new, empty wallet
 */
export function createWallet({ name, password, slackId } : { name?: string, password?: string, slackId?: string }): Promise<Wallet> {
  const { publicKey, secretKey } = generateKeys();
  const newWallet: Wallet = {
    publicKey,
    secretKey,
    name: name || slackId,
    passwordHash: getHash(name + (password || slackId) + SALT),
    tokens: [],
    slackId
  };
  return walletRef.push(newWallet).then(() => newWallet);
}

/**
 * Generate a reusable Bearer token from a username and password and attach it to the appropriate wallet
 */
export function getToken(name: string, password: string): Promise<string> {
  return getAllWalletsWithReferences().then(wallets => {
    const walletId = Object.keys(wallets).find(id => wallets[id].name === name);
    const wallet = wallets[walletId];

    if (!wallet) {
      throw new Error('Invalid name or password');
    }

    if (wallet.passwordHash !== getHash(name + password + SALT)) {
      throw new Error('Invalid name or password');
    }

    const token = getHash(Date.now() + name + password);
    return firebase.ref(`/wallets/${walletId}/tokens`)
      .update([...wallet.tokens, token])
      .then(() => token);
  });
};

/**
 * Selects a wallet based on a Bearer token
 */
export function authenticate(token: string): Promise<Wallet | void> {
  return getAllWallets().then(wallets => wallets.find(wallet => wallet.tokens.includes(token)));
}

/**
 * Selects a wallet based on a slack id
 */
export function getSlackWallet(slackId: string): Promise<Wallet | void> {
  return getAllWallets().then(wallets => wallets.find(wallet => wallet.slackId === slackId));
}

/**
 * Get or create slack wallet
 */
export function ensureSlackWallet(slackId: string): Promise<Wallet> {
  return getSlackWallet(slackId).then(exisitingWallet => {
    if (exisitingWallet) {
      return exisitingWallet;
    }
    return createWallet({ slackId });
  })
}