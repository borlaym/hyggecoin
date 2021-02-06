import { generateTransactionID, REWARD_AMOUNT, Transaction, validateCoinbaseTransaction } from "./transaction"
import { generateKeys } from "./wallet"

const { secretKey, publicKey } = generateKeys();

const SAMPLE_COINBASE_TRANSACTION: Transaction = {
  id: 'd7e7438077a2c85e311f2cc32dc0cff47d1cc77a22f2a7a99552d6925f27855e',
  blockHeight: 1,
  inputs: [],
  outputs: [{
    address: 'fake static public key',
    amount: REWARD_AMOUNT
  }]
}

const SAMPLE_TRANSACTION_1: Transaction = {
  id: '',
  blockHeight: 4,
  inputs: [{
    transactionId: 'previous-transaction-id',
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
})