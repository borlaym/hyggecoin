import { balanceOfAddress, createCoinbaseTransaction, createOutputs, createTransaction, createUnspentTransactionOutputs, generateTransactionID, REWARD_AMOUNT, signTransactionInputs, Transaction, validateCoinbaseTransaction, validateOutput, validateTransaction } from "./transaction"
import { generateKeys } from "./wallet"
import { createBlock, validateChain } from "./block";
import { GENESIS_BLOCK } from "./db";

jest.mock('./firebase', () => ({ ref: (): null => null }))

/**
 * generate static keys that don't change from test to test
 */
const { secretKey: aliceSecret, publicKey: alicePublic } = generateKeys('test');
const { secretKey: bruceSecret, publicKey: brucePublic } = generateKeys('test2');

const BLOCK_1_COINBASE_TRANSACTION = createCoinbaseTransaction(1, alicePublic, aliceSecret);

const BLOCK_2_COINBASE_TRANSACTION = createCoinbaseTransaction(2, alicePublic, aliceSecret);

const BLOCK_2_ALICE_SENDS_TO_BRUCE = createTransaction([{
  transactionId: BLOCK_1_COINBASE_TRANSACTION.id,
  transactionOutputIndex: 0,
  signature: ''
}], [{
  address: brucePublic,
  amount: 5
}, {
  address: alicePublic,
  amount: 45
}], '', aliceSecret);

const BLOCK_3_COINBASE_TRANSACTION = createCoinbaseTransaction(3, alicePublic, aliceSecret);

const BLOCK_3_ALICE_SENDS_TO_BRUCE = createTransaction([{
  transactionId: BLOCK_2_ALICE_SENDS_TO_BRUCE.id,
  transactionOutputIndex: 1,
  signature: ''
}], [{
  address: brucePublic,
  amount: 10
}, {
  address: alicePublic,
  amount: 35
}], '', aliceSecret);

const BLOCK_4_COINBASE_TRANSACTION = createCoinbaseTransaction(4, alicePublic, aliceSecret);

const BLOCK_4_BRUCE_SENDS_TO_ALICE = createTransaction([{
  transactionId: BLOCK_2_ALICE_SENDS_TO_BRUCE.id,
  transactionOutputIndex: 0,
  signature: ''
}, {
  transactionId: BLOCK_3_ALICE_SENDS_TO_BRUCE.id,
  transactionOutputIndex: 0,
  signature: ''
}], [{
  address: alicePublic,
  amount: 12
}, {
  address: brucePublic,
  amount: 3
}], '', bruceSecret);

// Test if it works correctly if the transaction references a transaction in the same block
const BLOCK_4_ALICE_SENDS_SOME_BACK = createTransaction([{
  transactionId: BLOCK_4_BRUCE_SENDS_TO_ALICE.id,
  transactionOutputIndex: 0,
  signature: ''
}], [{
  address: brucePublic,
  amount: 2
}, {
  address: alicePublic,
  amount: 10
}], '', bruceSecret);

const UNCONFIRMED_TRANSACTION = createTransaction([{
  transactionId: BLOCK_1_COINBASE_TRANSACTION.id,
  transactionOutputIndex: 0,
  signature: ''
}], [{
  address: brucePublic,
  amount: 50
}], '', aliceSecret);

describe('transaction', () => {
  describe('validateCoinbaseTransaction', () => {
    it('valiades successfully', () => {
      expect(validateCoinbaseTransaction(BLOCK_1_COINBASE_TRANSACTION, 1)).toBe(true);
    })
  })
  describe('validating transactions', () => {
    const transactionWithId = {
      ...BLOCK_2_ALICE_SENDS_TO_BRUCE,
      id: generateTransactionID(BLOCK_2_ALICE_SENDS_TO_BRUCE)
    };
    const signedTransaction = signTransactionInputs(transactionWithId, aliceSecret);
    it('validateTransaction', () => {
      expect(validateTransaction(signedTransaction, createUnspentTransactionOutputs(BLOCK_1_COINBASE_TRANSACTION), [])).toBe(true)
    })
    it('validateTransaction should throw error if a referenced output is already among unconfirmed transactions', () => {
      expect(() =>
        validateTransaction(signedTransaction, createUnspentTransactionOutputs(BLOCK_1_COINBASE_TRANSACTION), [UNCONFIRMED_TRANSACTION])
      ).toThrowError('Transaction references an output already used by another unconfirmed transaction')
    })
    describe('output amount', () => {
      it('should not allow 0 or negative', () => {
        expect(validateOutput({ address: brucePublic, amount: 0 })).toEqual(new Error('Can\'t create output for 0'));
        expect(validateOutput({ address: brucePublic, amount: -10 })).toEqual(new Error('Can\'t create output for negative amount'))
      })
      it('should only allow sending integers', () => {
        expect(validateOutput({ address: brucePublic, amount: 0.000001 })).toEqual(new Error('Only whole coins can be sent'));
      })
    })
  })
  describe('creating transactions', () => {
    it('signTransactionInputs', () => {
      expect(BLOCK_2_ALICE_SENDS_TO_BRUCE.inputs[0].signature.length).toBeGreaterThan(100);
    })

    it('transaction message should be included in hash', () => {
      const transaction: Transaction = {
        id: '',
        inputs: [],
        outputs: [],
        message: ''
      };
      const id = generateTransactionID({ ...transaction, message: 'This is a message'});
      const id2 = generateTransactionID(transaction);
      expect(id).not.toEqual(id2);
    })
  })
  describe('calculating unspent outputs', () => {
    it('only spending from previous blocks', () => {
      const block1 = createBlock([BLOCK_1_COINBASE_TRANSACTION], GENESIS_BLOCK.hash)
      const block2 = createBlock([BLOCK_2_COINBASE_TRANSACTION, BLOCK_2_ALICE_SENDS_TO_BRUCE], block1.hash);
      const block3 = createBlock([BLOCK_3_COINBASE_TRANSACTION, BLOCK_3_ALICE_SENDS_TO_BRUCE], block2.hash);
      const block4 = createBlock([BLOCK_4_COINBASE_TRANSACTION, BLOCK_4_BRUCE_SENDS_TO_ALICE], block3.hash);
      const blockChain = [
        GENESIS_BLOCK,
        block1,
        block2,
        block3,
        block4
      ];
      expect(validateChain(blockChain)).toBe(true);
      expect(balanceOfAddress(blockChain, [], alicePublic)).toBe(197);
      expect(balanceOfAddress(blockChain, [], brucePublic)).toBe(3);
    });
    it('can spend from the yet-to-be-mined transactions', () => {
      const block1 = createBlock([BLOCK_1_COINBASE_TRANSACTION], GENESIS_BLOCK.hash)
      const block2 = createBlock([BLOCK_2_COINBASE_TRANSACTION, BLOCK_2_ALICE_SENDS_TO_BRUCE], block1.hash);
      const block3 = createBlock([BLOCK_3_COINBASE_TRANSACTION, BLOCK_3_ALICE_SENDS_TO_BRUCE], block2.hash);
      const blockChain = [
        GENESIS_BLOCK,
        block1,
        block2,
        block3
      ];
      const unconfirmed = [
        BLOCK_4_BRUCE_SENDS_TO_ALICE,
        BLOCK_4_ALICE_SENDS_SOME_BACK
      ]
      expect(validateChain(blockChain)).toBe(true);
      expect(balanceOfAddress(blockChain, unconfirmed, alicePublic)).toBe(145);
      // expect(balanceOfAddress(blockChain, unconfirmed, brucePublic)).toBe(5);
    })
  })
  describe('createOutputs', () => {
    it('should create proper outputs', () => {
      expect(createOutputs(alicePublic, brucePublic, 20, 5)).toEqual([{
        address: brucePublic,
        amount: 20
      }, {
        address: alicePublic,
        amount: 5
      }]);
    })
    it('should not create an output for 0 amount', () => {
      expect(createOutputs(alicePublic, brucePublic, 20, 0)).toEqual([{
        address: brucePublic,
        amount: 20
      }])
    })
  });
})