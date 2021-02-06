import { getHash, toHexString } from "./util";
const ec = require('elliptic').ec;

type TransactionOutput = {
  address: string;
  amount: number;
}

type UnspentTransactionOutput = {
  transactionId: string;
  index: number;
  address: string;
  amount: string;
}

type TransactionInput = {
  transactionOutputId: string;
  transactionOutputIndex: string;
  signature: string;
}

type Transaction = {
  id: string;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  signature: string;
}

/**
 * Generate a has from the transaction's inputs and outputs to use as the id of the transaction
 */
function generateTransactionID(transaction: Transaction): string {
  const content = transaction.inputs.map(input => input.transactionOutputId + input.transactionOutputIndex).join('') +
    transaction.outputs.map(output => output.address + output.amount);
  return getHash(content);
}

/**
 * Using your private key, sign a transaction's inputs
 */
function signTransactionInputs(transaction: Transaction, privateKey: string, myUnspentTransactionOutputs: UnspentTransactionOutput[]): Transaction {
  const key = ec.keyFromPrivate(privateKey, 'hex');
  return ({
    ...transaction,
    inputs: transaction.inputs.map(input => {
      return {
        ...input,
        signature: toHexString(key.sign(transaction.id).toDER())
      };
    })
  })
}
