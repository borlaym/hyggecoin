// Fake a db until everything is ready. I don't want to reset the db every time I change something

import { Block, Chain, checkDifficulty, createBlock, getDifficultyForNextBlock, getHashBase, validateChain } from "./block";
import firebase from "./firebase";
import { calculateUnspentOutputs, createOutputs, createUnsignedInputFromUnspentOutput, Transaction, TransactionInput, TransactionOutput, UnspentTransactionOutput, unspentTransactionsOfAddress, validateCoinbaseTransaction, validateTransaction } from "./transaction";

const chainRef = firebase.ref('/chain');
const transactionsRef = firebase.ref('/transactions');
const hashDebugRef = firebase.ref('/hash-debug');

export const GENESIS_BLOCK: Block<Transaction[]> = {
  previousHash: '0',
  hash: '71ce399acfbec8338142fe71828dbadd901cbc96c907d67ea61110dc08b272ae',
  timestamp: 0,
  data: [],
  nonce: 1
};

export function getBlocks(): Promise<Chain<Transaction[]>> {
  return chainRef.get().then(snapshot => {
    const data: { [key: string]: Block<Transaction[]> } = snapshot.val() || {};
    // Firebase stores blocks as key value pairs
    const blocks = Object.values(data) || [];
    return [GENESIS_BLOCK, ...blocks];
  })
}

export function getBlockByHash(hash: string): Promise<Block<Transaction[]> | null> {
  return getBlocks().then(chain => chain.find(block => block.hash === hash))
}

export function getLastBlock(): Promise<Block<Transaction[]> | null> {
  return getBlocks().then(chain => chain[chain.length - 1]);
}

export function getUnconfirmedTransactions(): Promise<Transaction[]> {
  return transactionsRef.get().then(snapshot => {
    const data: { [key: string]: Transaction } = snapshot.val() || {};
    return Object.values(data) || [];
  })
}

export function addTransaction(transaction: Transaction): Promise<Transaction> {
  return Promise.all([
    getBlocks(),
    getUnconfirmedTransactions()
  ]).then(([chain, unconfirmedTransactions]) => {
    try {
      if (validateTransaction(transaction, calculateUnspentOutputs(chain, unconfirmedTransactions), unconfirmedTransactions)) {
        return transactionsRef.push(transaction).then(() => transaction);
      }
      return Promise.reject(new Error('Unable to valdidate transaction'));
    } catch (err) {
      return Promise.reject(err);
    }
  })
}

export function addBlock(block: Block<Transaction[]>): Promise<boolean> {
  return Promise.all([
    getBlocks(),
    getUnconfirmedTransactions()
  ]).then(([chain, unconfirmedTransactions]) => {
    if (!validateCoinbaseTransaction(block.data[0], chain.length)) {
      throw new Error('Invalid coinbase transaction');
    }
    if (!validateChain([...chain, block])) {
      throw new Error('Invalid chain');
    }
    const requiredDifficulty = getDifficultyForNextBlock(chain);
    if (!checkDifficulty(requiredDifficulty, block.hash)) {
      throw new Error('Block doesn\'t meet difficulty criteria');
    }

    const remainingUnconfirmedTransactions = unconfirmedTransactions.filter(unconfirmedTransaction => !block.data.find(transactionOnBlock => transactionOnBlock.id === unconfirmedTransaction.id));
    // Update chain with new block and remove mined transactions from unconfirmed
    return Promise.all([
      chainRef.push(block),
      transactionsRef.set(remainingUnconfirmedTransactions),
      hashDebugRef.push({
        hash: block.hash,
        hashBase: getHashBase(block)
      })
    ]).then(() => true)
  });
}

export async function getCoinsInCirculation(): Promise<number> {
  return Promise.all([
    getBlocks(),
    getUnconfirmedTransactions()
  ]).then(([chain, unconfirmedTransactions]) => {
    return calculateUnspentOutputs(chain, unconfirmedTransactions).reduce((acc, unspentOutput) => acc + unspentOutput.amount, 0);
  })
}

export async function getBalance(publicKey: string): Promise<number> {
  return Promise.all([
    getBlocks(),
    getUnconfirmedTransactions()
  ]).then(([chain, unconfirmedTransactions]) => {
    return calculateUnspentOutputs(chain, unconfirmedTransactions).filter(output => output.address === publicKey).reduce((acc, unspentOutput) => acc + unspentOutput.amount, 0);
  });
}

export function findUnspentOutputsForAmount(myUnspentTransactionOutputs: UnspentTransactionOutput[], requestedAmount: number): { includedOutputs: UnspentTransactionOutput[], leftoverAmount: number } {
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

export async function createTransaction(myPublicKey: string, targetPublicKey: string, message: string | null, amount: number): Promise<Transaction> {
  return Promise.all([
    getBlocks(),
    getUnconfirmedTransactions()
  ]).then(([chain, unconfirmedTransactions]) => {
    const myUnspentTransactionOutputs = unspentTransactionsOfAddress(chain, unconfirmedTransactions, myPublicKey);
    const { includedOutputs, leftoverAmount } = findUnspentOutputsForAmount(myUnspentTransactionOutputs, amount);
    return {
      id: '',
      inputs: includedOutputs.map(output => createUnsignedInputFromUnspentOutput(output)),
      outputs: createOutputs(myPublicKey, targetPublicKey, amount, leftoverAmount),
      message
    }
  });
}