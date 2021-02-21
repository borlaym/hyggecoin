// Fake a db until everything is ready. I don't want to reset the db every time I change something

import { Block, Chain } from "./block";
import { calculateUnspentOutputs, Transaction, validateTransaction } from "./transaction";

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