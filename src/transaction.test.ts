import { createUnspentTransactionOutputs, generateTransactionID, REWARD_AMOUNT, signTransactionInputs, Transaction, validateCoinbaseTransaction, validateTransaction } from "./transaction"
import { generateKeysFromPassword } from "./wallet"
import * as ecdsa from 'elliptic';

const ec = new ecdsa.ec('secp256k1');

/**
 * generate static keys that don't change from test to test
 */
const { secretKey, publicKey } = generateKeysFromPassword('test');

const SAMPLE_COINBASE_TRANSACTION: Transaction = {
  id: 'a1502f05cf3551257f847eb18acf8a55c790dbce5d240f4a5cd7add0682ea191',
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
    transactionId: 'a1502f05cf3551257f847eb18acf8a55c790dbce5d240f4a5cd7add0682ea191',
    transactionOutputIndex: 1,
    signature: ''
  }],
  outputs: [{
    address: publicKey,
    amount: 5
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