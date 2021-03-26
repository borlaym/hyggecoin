import { getHash, toHexString } from "./util";
import * as ecdsa from 'elliptic';
import { Chain, createBlock } from "./block";

const ec = new ecdsa.ec('secp256k1');

/**
 * Amount of coins rewarded for the miner of the block
 */
export const REWARD_AMOUNT = 10;

/**
 * Max characters length of the transaction message
 */
export const TRANSACTION_MESSAGE_MAX_LENGTH = 130;

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
   * The sender must sign this input with their private key
   * Q: why is not the whole transaction signed instead of the individual inputs, since we use the transaction id as the content for the signature anyway?
   */
  signature: string;
  /**
   * The id of the transaction that holds the unspent output this input is referencing.
   */
  transactionId: string;
  /**
   * Since one transaction can have a number of outputs, we need to know the index of the output inside that transaction this input is referencing
   */
  transactionOutputIndex: number;
}

export type Transaction = {
  /**
   * Derived from all other fields of the transaction, excluding signatures. When the data changes, the id should change.
   */
  id: string;
  /**
   * References to unspent outputs belonging to the user
   */
  inputs: TransactionInput[];
  /**
   * All outputs must add up to the total value of all inputs. If there is some leftover, an output should be added that sends the leftover back to the sender.
   */
  outputs: TransactionOutput[];
  /**
   * Optional message to be included with the transaction
   */
  message: string | null;
}

/**
 * Generate a has from the transaction's inputs and outputs to use as the id of the transaction
 */
export function generateTransactionID(transaction: Transaction): string {
  const content = transaction.inputs.map(input => input.transactionId + input.transactionOutputIndex).join('') +
    transaction.outputs.map(output => output.address + output.amount).join('') +
    (transaction.message || '');
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
 * Using your private key, sign a transaction's inputs and generate its id
 */
export function signTransaction(transaction: Transaction, secretKey: string): Transaction {
  return signTransactionInputs({
    ...transaction,
    id: generateTransactionID(transaction)
  }, secretKey);
}

/**
 * Helper for creating a transaction with calculated id, and signed
 */
export function createTransaction(inputs: TransactionInput[], outputs: TransactionOutput[], message: string | null, secretKey: string): Transaction {
  let transaction = {
    id: '',
    inputs,
    outputs,
    message
  };
  transaction = {
    ...transaction,
    id: generateTransactionID(transaction)
  };
  return signTransactionInputs(transaction, secretKey);
}

/**
 * Helper for creating a coinbase transaction
 */
export function createCoinbaseTransaction(blockHeight: number, publicKey: string, secretKey: string): Transaction {
  return createTransaction([{
    signature: '',
    transactionId: '',
    transactionOutputIndex: blockHeight
  }], [{
    address: publicKey,
    amount: blockHeight === 1 ? 500 : REWARD_AMOUNT
  }], null, secretKey);
}

/**
 * Validate transaction outputs
 */
export function validateOutput(output: TransactionOutput): Error | null {

  // Validate output address
  if (typeof output.address !== 'string') {
    return new Error('Output address needs to be a valid address');
  }

  // Validate that no outputs are for 0 amount
  if (output.amount === 0) {
    return new Error('Can\'t create output for 0');
  }

  // Validate that no outputs are for negative amount
  if (output.amount < 0) {
    return new Error('Can\'t create output for negative amount');
  }

  // Validate that no outputs are for more than javascript's safe integer
  if (output.amount > Number.MAX_SAFE_INTEGER) {
    return new Error(`Can\'t create output for more than ${Number.MAX_SAFE_INTEGER}`);
  }

  // Validate that no fraction outputs have a greater precision than allowed
  if (!Number.isInteger(output.amount)) {
    return new Error(`Only whole coins can be sent`);
  }

  return null;
}

/**
 * Determines whether a transaction is valid or not, checking id and that the inputs are valid, and that inputs equal outputs
 */
export function validateTransaction(transaction: Transaction, myUnspentTransactionOutputs: UnspentTransactionOutput[], unconfirmedTransactions: Transaction[]): boolean {
  // Validate id
  if (generateTransactionID(transaction) !== transaction.id) {
    throw new Error('Transaction ID incorrect');
  }

  // Validate that the transaction doesn't reference an input that has already been referenced by another unconfirmed transaction
  const allExistingInputs = unconfirmedTransactions.reduce<TransactionInput[]>((arr, transaction) => [...arr, ...transaction.inputs], []);
  const referencesLockedTransaction = transaction.inputs.find(newInput => allExistingInputs.find(existingInput => existingInput.transactionId === newInput.transactionId && existingInput.transactionOutputIndex == newInput.transactionOutputIndex));
  if (referencesLockedTransaction) {
    throw new Error('Transaction references an output already used by another unconfirmed transaction');
  }

  // Validate that all inputs are unspent and belong to the user
  const allInputsValid = transaction.inputs.map(input => {
    const referencedOutput = myUnspentTransactionOutputs.find(unspentOutput => unspentOutput.transactionId === input.transactionId && unspentOutput.index === input.transactionOutputIndex);
    if (!referencedOutput) {
      console.error('Referenced output doesn\'t exist');
      return false;
    }
    const address = referencedOutput.address;
    const key = ec.keyFromPublic(address, 'hex');
    return key.verify(transaction.id, input.signature);
  }).filter(Boolean).length === transaction.inputs.length;

  if (!allInputsValid) {
    throw new Error('Not all inputs are valid for transaction.')
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
    throw new Error('Input and output values do not match in transaction.');
  }

  // Validate outputs
  const outputError = transaction.outputs.find(output => validateOutput(output));
  if (outputError) {
    throw outputError;
  }

  // Validate that the transaction message is valid type
  if (!(typeof transaction.message === 'string' || transaction.message === null)) {
    throw new Error('Invalid message type');
  }

  // Validate that the transaction message is valid if exists
  if (transaction.message && transaction.message.length > TRANSACTION_MESSAGE_MAX_LENGTH) {
    throw new Error(`Message exceeds ${TRANSACTION_MESSAGE_MAX_LENGTH} chacracters`);
  }

  return true;
}

/**
 * Coinbase transactions are always the first transactions in a block, and they reward the miner of the block with REWARD_AMOUNT
 * Checking its validity is different. The input's index is the block's index.
 * Q: Why does this have to have any inputs anyway? Maybe because the need to sign it? Would someone be able to steal an output otherwise?
 * Right now I'm just going to ignore the input and only have an output, before I understand this.
 */
export function validateCoinbaseTransaction(transaction: Transaction, blockHeight: number) {
  // Validate id
  const generatedId = generateTransactionID(transaction);
  if (generatedId !== transaction.id) {
    throw new Error('Transaction ID incorrect.')
  }

  if (transaction.inputs.length !== 1) {
    throw new Error('Coinbase transaction can only have one input.');
  }

  if (transaction.inputs[0].transactionOutputIndex !== blockHeight) {
    throw new Error('Coinbase transaction\'s input must contain blockHeight as the output index.');
  }

  if (transaction.outputs.length !== 1) {
    throw new Error('Coinbase transaction can only have one output.');
  }

  const correctRewardAmount = blockHeight === 1 ? 500 : REWARD_AMOUNT;

  if (transaction.outputs[0].amount !== correctRewardAmount) {
    throw new Error('Coinbase transaction value must be for ' + correctRewardAmount);
  }

  if (transaction.message !== null) {
    throw new Error('Coinbase transaction can\'t include a message');
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
export function calculateUnspentOutputs(chain: Chain<Transaction[]>, unconfirmedTransactions: Transaction[]): UnspentTransactionOutput[] {
  const chainWithUnconfirmed = [...chain, createBlock(unconfirmedTransactions, chain[chain.length - 1].hash)];
  // TODO: I think there is a bug now when the input references a transaction in the same block
  return chainWithUnconfirmed.reduce<UnspentTransactionOutput[]>((unspentTransactions, block) => {
    // Gather all new outputs on this block
    const newUnspentOutputs = block.data.reduce<UnspentTransactionOutput[]>((acc, transaction) => acc.concat(createUnspentTransactionOutputs(transaction)), []);
    // Gather all inputs on this block, so we can use them to unvalidate older outputs
    const allInputsOnThisBlock = block.data.reduce<TransactionInput[]>((acc, transaction) => acc.concat(transaction.inputs), []);
    // Invalidate outputs based on these new inputs
    const remainingUnspentTransactions: UnspentTransactionOutput[] = [...unspentTransactions, ...newUnspentOutputs].filter(unspentTransaction => {
      // Remove unspenttransaction if the current block references it as an input
      if (allInputsOnThisBlock.find(input => input.transactionId === unspentTransaction.transactionId && input.transactionOutputIndex === unspentTransaction.index)) {
        return false;
      }
      return true;
    });
    return remainingUnspentTransactions
  }, []);
}

/**
 * Get all unspent transactions of a single user
 */
export function unspentTransactionsOfAddress(chain: Chain<Transaction[]>, unconfirmedTransactions: Transaction[], address: string): UnspentTransactionOutput[] {
  const allUnspentTransactions = calculateUnspentOutputs(chain, unconfirmedTransactions);
  return allUnspentTransactions.filter(transaction => transaction.address === address);
}

/**
 * Get remaining coins of a single user
 */
export function balanceOfAddress(chain: Chain<Transaction[]>, unconfirmedTransactions: Transaction[], address: string): number {
  const unspentTransactions = unspentTransactionsOfAddress(chain, unconfirmedTransactions, address);
  return unspentTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);
}

/**
 * Helper for creating an input from an unspent output
 */
export function createUnsignedInputFromUnspentOutput(output: UnspentTransactionOutput): TransactionInput {
  return {
    signature: '',
    transactionId: output.transactionId,
    transactionOutputIndex: output.index,
  };
}

/**
 * Helper for creating a one way transaction output
 */
export function createOutputs(myPublicKey: string, receiverPublicKey: string, amount: number, leftoverAmount: number): TransactionOutput[] {
  if (leftoverAmount > 0) {
    return [{
      address: receiverPublicKey,
      amount
    }, {
      address: myPublicKey,
      amount: leftoverAmount
    }];
  }

  return [{
    address: receiverPublicKey,
    amount
  }];
}