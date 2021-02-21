import { getHash, toHexString } from "./util";
import * as ecdsa from 'elliptic';
import { Chain } from "./block";

const ec = new ecdsa.ec('secp256k1');

/**
 * Amount of coins rewarded for the miner of the block
 */
export const REWARD_AMOUNT = 50;


export type TransactionOutput = {
  /**
   * This is the public key of the user the number of coins are sent to
   */
  address: string;
  /**
   * Number of coins to send
   */
  amount: number;
}

/**
 * This is a utility type to hold information needed when handling unspent transaction outputs. Otherwise the entire transaction would need to be passed around.
 */
export type UnspentTransactionOutput = {
  /**
   * Id of the transaction this output belongs to
   */
  transactionId: string;
  /**
   * Index of the output inside the transaction outputs. Needed because one transaction can have multiple outputs, and we need to find the corresponding output when we verify
   */
  index: number;
  /**
   * Public key of recipient. Copied from the output directly.
   */
  address: string;
  /**
   * Amount of coins sent. Copied from the output directly.
   */
  amount: number;
}

export type TransactionInput = {
  /**
   * The id of the transaction that holds the unspent output this input is referencing.
   */
  transactionId: string;
  /**
   * Since one transaction can have a number of outputs, we need to know the index of the output inside that transaction this input is referencing
   */
  transactionOutputIndex: number;
  /**
   * The sender must sign this input with their private key
   * Q: why is not the whole transaction signed instead of the individual inputs, since we use the transaction id as the content for the signature anyway?
   */
  signature: string;
}

export type Transaction = {
  /**
   * Derived from all other fields of the transaction, excluding signatures. When the data changes, the id should change.
   */
  id: string;
  /**
   * The index of the block the transaction is attached to. This is needed to ensure that reward transaction ids are always different.
   * Otherwise the same id would be generated each time for "John Done gets 50 coins".
   */
  blockHeight: number;
  /**
   * References to unspent outputs belonging to the user
   */
  inputs: TransactionInput[];
  /**
   * All outputs must add up to the total value of all inputs. If there is some leftover, an output should be added that sends the leftover back to the sender.
   */
  outputs: TransactionOutput[];
}

/**
 * Generate a has from the transaction's inputs and outputs to use as the id of the transaction
 */
export function generateTransactionID(transaction: Transaction): string {
  const content = transaction.inputs.map(input => input.transactionId + input.transactionOutputIndex).join('') +
    transaction.outputs.map(output => output.address + output.amount + transaction.blockHeight).join('');
  return getHash(content);
}

/**
 * Using your private key, sign a transaction's inputs
 */
export function signTransactionInputs(transaction: Transaction, secretKey: string): Transaction {
  const key = ec.keyFromPrivate(secretKey, 'hex');
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
 * Helper for creating a transaction with calculated id, and signed
 */
export function createTransaction(inputs: TransactionInput[], outputs: TransactionOutput[], blockHeight: number, secretKey: string): Transaction {
  let transaction = {
    id: '',
    blockHeight,
    inputs,
    outputs
  };
  transaction = {
    ...transaction,
    id: generateTransactionID(transaction)
  };
  return signTransactionInputs(transaction, secretKey);
}

/**
 * Determines whether a transaction is valid or not, checking id and that the inputs are valid, and that inputs equal outputs
 */
export function validateTransaction(transaction: Transaction, myUnspentTransactionOutputs: UnspentTransactionOutput[], unconfirmedTransactions: Transaction[]): boolean {
  // Validate id
  if (generateTransactionID(transaction) !== transaction.id) {
    console.error('Transaction ID incorrect.')
    return false;
  }

  // Validate that the transaction doesn't reference an input that has already been referenced by another unconfirmed transaction
  const allExistingInputs: TransactionInput[] = unconfirmedTransactions.reduce((arr, transaction) => [...arr, ...transaction.inputs], []);
  const referencesLockedTransaction = transaction.inputs.find(newInput => allExistingInputs.find(existingInput => existingInput.transactionId === newInput.transactionId && existingInput.transactionOutputIndex == newInput.transactionOutputIndex));
  if (referencesLockedTransaction) {
    console.error('Transaction references an output already used by another unconfirmed transaction');
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

/**
 * Coinbase transactions are always the first transactions in a block, and they reward the miner of the block with REWARD_AMOUNT
 * Checking its validity is different. The input's index is the block's index.
 * Q: Why does this have to have any inputs anyway? Maybe because the need to sign it? Would someone be able to steal an output otherwise?
 * Right now I'm just going to ignore the input and only have an output, before I understand this.
 */
export function validateCoinbaseTransaction(transaction: Transaction) {
  // Validate id
  const generatedId = generateTransactionID(transaction);
  if (generatedId !== transaction.id) {
    console.error('Transaction ID incorrect.')
    return false;
  }

  // TODO / Q: check input?

  if (transaction.outputs.length !== 1) {
    console.error('Coinbase transaction can only have one output.');
    return false;
  }

  if (transaction.outputs[0].amount !== REWARD_AMOUNT) {
    console.error('Coinbase transaction value must be for ' + REWARD_AMOUNT);
    return false;
  }
  return true;
}

/**
 * Helper for converting a transaction's outputs into unspent transactions
 */
export function createUnspentTransactionOutputs(transaction: Transaction): UnspentTransactionOutput[] {
  return transaction.outputs.map((output, index) => ({
    transactionId: transaction.id,
    index,
    address: output.address,
    amount: output.amount
  }));
}

/**
 * Calculate all unspent transactions at the end of a blockchain, regardless of target address
 */
export function calculateUnspentOutputs(chain: Chain<Transaction[]>): UnspentTransactionOutput[] {
  // TODO: I think there is a bug now when the input references a transaction in the same block
  return chain.reduce<UnspentTransactionOutput[]>((unspentTransactions, block) => {
    const newUnspentOutputs: UnspentTransactionOutput[] = block.data.reduce((acc, transaction) => acc.concat(createUnspentTransactionOutputs(transaction)), []);
    const allInputsOnThisBlock: TransactionInput[] = block.data.reduce((acc, transaction) => acc.concat(transaction.inputs), []);
    const remainingUnspentTransactions: UnspentTransactionOutput[] = unspentTransactions.filter(unspentTransaction => {
      // Remove unspenttransaction if the current block references it as an input
      if (allInputsOnThisBlock.find(input => input.transactionId === unspentTransaction.transactionId && input.transactionOutputIndex === unspentTransaction.index)) {
        return false;
      }
      return true;
    });
    return [...remainingUnspentTransactions, ...newUnspentOutputs];
  }, []);
}

/**
 * Get all unspent transactions of a single user
 */
export function unspentTransactionsOfAddress(chain: Chain<Transaction[]>, address: string): UnspentTransactionOutput[] {
  const allUnspentTransactions = calculateUnspentOutputs(chain);
  return allUnspentTransactions.filter(transaction => transaction.address === address);
}

/**
 * Get remaining coins of a single user
 */
export function balanceOfAddress(chain: Chain<Transaction[]>, address: string): number {
  const unspentTransactions = unspentTransactionsOfAddress(chain, address);
  return unspentTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);
}