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

let wallets: Wallet[] = [{
  "publicKey": "04b77787ca1df318e2e515252a4cfa643883934188ad390380108559e050867f99cf5f4a2c63251a337563bb916796c60f7a7705b7d9b05442e1c04bfd00cc918a",
  "secretKey": "869cd7bdcfc5fee6dc0ea48155115a33953dc55ebbbb282d5960443de89412b5",
  "name": "alice",
  "passwordHash": "2458fc44725895334c541414b3ddb78e142bf5dfae2d938b46acb1cf625f17a4", // password is test
  "tokens": ['468233fbe015a8412b78b8f25d7a12c38287b3bca6d6d892438c141655ded1e0']
}, {
  "publicKey": "0437a334c1dbabfd5f6f3b286d4c6f933bc54326310f6a2089e8f02a107313ca17228c46f746b9f75986b8a64fc4f8a69c003932cbb9bcf077a97886003401f185",
  "secretKey": "6fb996031dd3d7047ff156afa72b7b9edcf81d6595ab95cb8032838a1afc304f",
  "name": "bob",
  "passwordHash": "0726babf905be6eae6f51dae63ca4742cee9394f559830230c317f901e22f549", // password is test
  "tokens":['33721282c5617c05364bb499efbcc4446dd48918ebf2dab9ea7d3e496921b02f']}
];

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
  const newWallet: Wallet = {
    publicKey,
    secretKey,
    name,
    passwordHash: getHash(name + password + SALT),
    tokens: []
  };
  wallets = [...wallets, newWallet];
  return newWallet;
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