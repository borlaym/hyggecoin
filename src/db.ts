// Fake a db until everything is ready. I don't want to reset the db every time I change something

import { Block, Chain, createBlock, validateChain } from "./block";
import firebase from "./firebase";
import { calculateUnspentOutputs, createOutputs, createUnsignedInputFromUnspentOutput, Transaction, TransactionInput, TransactionOutput, UnspentTransactionOutput, unspentTransactionsOfAddress, validateCoinbaseTransaction, validateTransaction } from "./transaction";

const chainRef = firebase.ref('/chain');
const transactionsRef = firebase.ref('/transactions');

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

export function getBlocks(): Promise<Chain<Transaction[]>> {
  return chainRef.get().then(snapshot => [GENESIS_BLOCK, ...snapshot.val()?.data || []])
}

export function getBlockByHash(hash: string): Promise<Block<Transaction[]> | null> {
  return getBlocks().then(chain => chain.find(block => block.hash === hash))
}

export function getLastBlock(): Promise<Block<Transaction[]> | null> {
  return getBlocks().then(chain => chain[chain.length - 1]);
}

export function getUnconfirmedTransactions(): Promise<Transaction[]> {
  return transactionsRef.get().then(snapshot => snapshot.val()?.data || []);
}

export function addTransaction(transaction: Transaction): Promise<Transaction> {
  return Promise.all([
    getBlocks(),
    getUnconfirmedTransactions()
  ]).then(([chain, unconfirmedTransactions]) => {
    if (validateTransaction(transaction, calculateUnspentOutputs(chain, unconfirmedTransactions), unconfirmedTransactions)) {
      return transactionsRef.push(transaction).then(() => transaction);
    }
    throw new Error('Unable to add transaction, invalid transaction');
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
    const remainingUnconfirmedTransactions = unconfirmedTransactions.filter(unconfirmedTransaction => !block.data.find(transactionOnBlock => transactionOnBlock.id === unconfirmedTransaction.id));
    // Update chain with new block and remove mined transactions from unconfirmed
    return Promise.all([
      chainRef.push(block),
      transactionsRef.set(remainingUnconfirmedTransactions)
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

export async function createTransaction(myPublicKey: string, targetPublicKey: string, amount: number): Promise<Transaction> {
  return Promise.all([
    getBlocks(),
    getUnconfirmedTransactions()
  ]).then(([chain, unconfirmedTransactions]) => {
    const myUnspentTransactionOutputs = unspentTransactionsOfAddress(chain, unconfirmedTransactions, myPublicKey);
    const { includedOutputs, leftoverAmount } = findUnspentOutputsForAmount(myUnspentTransactionOutputs, amount);
    return {
      id: '',
      inputs: includedOutputs.map(output => createUnsignedInputFromUnspentOutput(output)),
      outputs: createOutputs(myPublicKey, targetPublicKey, amount, leftoverAmount)
    }
  });
}