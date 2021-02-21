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

/**
 * This is the blockchain itself, persisting between request but not between restarts
 */
let currentChain: Chain<Transaction[]> = [GENESIS_BLOCK];

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
  if (!validateCoinbaseTransaction(block.data[0])) {
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
    blockHeight: currentChain.length,
    inputs: includedOutputs.map(output => createUnsignedInputFromUnspentOutput(output)),
    outputs: createOutputs(myPublicKey, targetPublicKey, amount, leftoverAmount)
  }
}