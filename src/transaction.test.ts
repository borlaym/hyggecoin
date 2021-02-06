import { createUnspentTransactionOutputs, generateTransactionID, REWARD_AMOUNT, signTransactionInputs, Transaction, validateCoinbaseTransaction, validateTransaction } from "./transaction"
import { generateKeys } from "./wallet"
import * as ecdsa from 'elliptic';

const ec = new ecdsa.ec('secp256k1');

/**
 * generate static keys that don't change from test to test
 */
const { secretKey, publicKey } = generateKeys('test');
const { publicKey: targetAddress } = generateKeys('test2');

const SAMPLE_COINBASE_TRANSACTION: Transaction = {
  id: '1a13fb0b6fc4dfbb9e8135632443abf7b8e96a601cd9ddebeca3218db421e885',
  blockHeight: 1,
  inputs: [],
  outputs: [{
    address: publicKey,
    amount: REWARD_AMOUNT
  }]
}

const SAMPLE_TRANSACTION: Transaction = {
  id: '',
  blockHeight: 4,
  inputs: [{
    transactionId: '1a13fb0b6fc4dfbb9e8135632443abf7b8e96a601cd9ddebeca3218db421e885',
    transactionOutputIndex: 0,
    signature: ''
  }],
  outputs: [{
    address: targetAddress,
    amount: 5
  }, {
    address: publicKey,
    amount: 45
  }]
}

describe('transaction', () => {
  describe('validateCoinbaseTransaction', () => {
    it('valiades successfully', () => {
      expect(validateCoinbaseTransaction(SAMPLE_COINBASE_TRANSACTION)).toBe(true);
    })
  })
  describe('creating transactions', () => {
    const transactionWithId = {
      ...SAMPLE_TRANSACTION,
      id: generateTransactionID(SAMPLE_TRANSACTION)
    };
    const signedTransaction = signTransactionInputs(transactionWithId, secretKey);
    it('signTransactionInputs', () => {
      expect(signedTransaction.inputs[0].signature.length).toBeGreaterThan(100);
    })
    it('validateTransaction', () => {
      expect(validateTransaction(signedTransaction, createUnspentTransactionOutputs(SAMPLE_COINBASE_TRANSACTION))).toBe(true)
    })
  })
})