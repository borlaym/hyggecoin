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
  amount: number;
}

type TransactionInput = {
  transactionId: string;
  transactionOutputIndex: number;
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
  const content = transaction.inputs.map(input => input.transactionId + input.transactionOutputIndex).join('') +
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

/**
 * Determines whether a transaction is valid or not, checking id and that the inputs are valid, and that inputs equal outputs
 */
function validateTransaction(transaction: Transaction, myUnspentTransactionOutputs: UnspentTransactionOutput[]): boolean {
  // Validate id
  if (generateTransactionID(transaction) !== transaction.id) {
    console.error('Transaction ID incorrect.')
    return false;
  }

  // Validate that all inputs are unspent and belong to the user
  const allInputsValid = transaction.inputs.map(input => {
    const referencedOutput = myUnspentTransactionOutputs.find(unspentOutput => unspentOutput.transactionId === input.transactionId && unspentOutput.index === input.transactionOutputIndex);
    if (!referencedOutput) {
      return false;
    }
    const address = referencedOutput.address;
    const key = ec.keyFromPublic(address, 'hex');
    return key.verify(transaction.id, input.signature);
  }).filter(Boolean).length === transaction.inputs.length;

  if (!allInputsValid) {
    console.error('Not all inputs are valid for transaction.')
    return false;
  }

  // Check that all inputs equal outputs
  const inputValue = transaction.inputs.reduce((acc, input) => {
    const referencedOutput = myUnspentTransactionOutputs.find(unspentOutput => unspentOutput.transactionId === input.transactionId && unspentOutput.index === input.transactionOutputIndex);
    if (!referencedOutput) {
      return 0;
    }
    return acc + referencedOutput.amount;
  }, 0);
  const outputValue = transaction.outputs.reduce((acc, output) => acc + output.amount, 0);
  if (inputValue !== outputValue) {
    console.error('Input and output values do not match in transaction.');
    return false;
  }
  return true;
}
