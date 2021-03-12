// Fake a db until everything is ready. I don't want to reset the db every time I change something

import { Block, Chain, validateChain } from "./block";
import { calculateUnspentOutputs, createOutputs, createUnsignedInputFromUnspentOutput, Transaction, UnspentTransactionOutput, unspentTransactionsOfAddress, validateCoinbaseTransaction, validateTransaction } from "./transaction";

export const GENESIS_BLOCK: Block<Transaction[]> = {
  previousHash: '0',
  hash: '71ce399acfbec8338142fe71828dbadd901cbc96c907d67ea61110dc08b272ae',
  timestamp: 0,
  data: [],
  nonce: 1
};

const SAMPLE_BLOCK: Block<Transaction[]> = {
  timestamp: 1615551940605,
  data: [{
    id: "83a37ab1d86fccc378defc942f88db58ae97346f73109f3f2cf295fcbf4eff73",
    inputs: [
      {
        transactionId: "",
        transactionOutputIndex: 1,
        signature: "304502203673496137c5bccca1cd9499fffc656f22385ec33a9a3a79a6cb4e19f7223caf022100dcf49566d6e61bedf0796a40371a136d433f35041e9fcbf1b10a683117594eaf"
        }
    ],
    outputs: [{
      address: "04b77787ca1df318e2e515252a4cfa643883934188ad390380108559e050867f99cf5f4a2c63251a337563bb916796c60f7a7705b7d9b05442e1c04bfd00cc918a",
      amount: 50
    }]
  }],
  previousHash: "71ce399acfbec8338142fe71828dbadd901cbc96c907d67ea61110dc08b272ae",
  hash: "0044f35f662ef2fdb14ed1c5661ca873b6c1db0a1d60f11cd0c3360cfc5d094f",
  nonce: 751
};

/**
 * This is the blockchain itself, persisting between request but not between restarts
 */
let currentChain: Chain<Transaction[]> = [GENESIS_BLOCK, SAMPLE_BLOCK];

/**
 * Transactions that have been initiated, validated, but have yet to be mined and attached to a block
 */
let unconfirmedTransactions: Transaction[] = [];

export async function getBlocks(): Promise<Chain<Transaction[]>> {
  return currentChain;
}

export async function getBlockByHash(hash: string): Promise<Block<Transaction[]> | null> {
  return currentChain.find(block => block.hash === hash);
}

export async function getLastBlock(): Promise<Block<Transaction[]> | null> {
  return currentChain[currentChain.length - 1];
}

export async function addTransaction(transaction: Transaction): Promise<boolean> {
  if (validateTransaction(transaction, calculateUnspentOutputs(currentChain), unconfirmedTransactions)) {
    unconfirmedTransactions = [...unconfirmedTransactions, transaction];
    return true;
  }
  return false;
}

export async function getUnconfirmedTransactions(): Promise<Transaction[]> {
  return unconfirmedTransactions;
}

export async function addBlock(block: Block<Transaction[]>): Promise<boolean> {
  if (!validateCoinbaseTransaction(block.data[0], currentChain.length)) {
    return false;
  }
  if (!validateChain([...currentChain, block])) {
    return false;
  }
  currentChain = [...currentChain, block];
  return true;
}

export async function getCoinsInCirculation(): Promise<number> {
  return calculateUnspentOutputs(currentChain).reduce((acc, unspentOutput) => acc + unspentOutput.amount, 0);
}

export async function getBalance(publicKey: string): Promise<number> {
  return calculateUnspentOutputs(currentChain).filter(output => output.address === publicKey).reduce((acc, unspentOutput) => acc + unspentOutput.amount, 0);
}

export async function findUnspentOutputsForAmount(myUnspentTransactionOutputs: UnspentTransactionOutput[], requestedAmount: number): Promise<{ includedOutputs: UnspentTransactionOutput[], leftoverAmount: number }> {
  let currentAmount = 0;
  const includedOutputs = [];
  for (let i = 0; i < myUnspentTransactionOutputs.length; i++) {
    currentAmount += myUnspentTransactionOutputs[i].amount;
    includedOutputs.push(myUnspentTransactionOutputs[i]);
    if (currentAmount >= requestedAmount) {
      return {
        includedOutputs,
        leftoverAmount: currentAmount - requestedAmount
      };
    }
  }
  throw new Error('Requested more outputs than available coins');
}

export async function createTransaction(myPublicKey: string, targetPublicKey: string, amount: number): Promise<Transaction> {
  const myUnspentTransactionOutputs = unspentTransactionsOfAddress(currentChain, myPublicKey);
  const { includedOutputs, leftoverAmount } = await findUnspentOutputsForAmount(myUnspentTransactionOutputs, amount);
  return {
    id: '',
    inputs: includedOutputs.map(output => createUnsignedInputFromUnspentOutput(output)),
    outputs: createOutputs(myPublicKey, targetPublicKey, amount, leftoverAmount)
  }
}