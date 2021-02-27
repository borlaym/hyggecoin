import { balanceOfAddress, createTransaction, createUnspentTransactionOutputs, generateTransactionID, REWARD_AMOUNT, signTransactionInputs, validateCoinbaseTransaction, validateTransaction } from "./transaction"
import { generateKeys } from "./wallet"
import { createBlock, validateChain } from "./block";
import { GENESIS_BLOCK } from "./db";

/**
 * generate static keys that don't change from test to test
 */
const { secretKey: aliceSecret, publicKey: alicePublic } = generateKeys('test');
const { secretKey: bruceSecret, publicKey: brucePublic } = generateKeys('test2');

const BLOCK_1_COINBASE_TRANSACTION = createTransaction([], [{
  address: alicePublic,
  amount: REWARD_AMOUNT
}], 1, aliceSecret);

const BLOCK_2_COINBASE_TRANSACTION = createTransaction([], [{
  address: alicePublic,
  amount: REWARD_AMOUNT
}], 2, aliceSecret);

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
}], 2, aliceSecret);

const BLOCK_3_COINBASE_TRANSACTION = createTransaction([], [{
  address: alicePublic,
  amount: REWARD_AMOUNT
}], 3, aliceSecret);

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
}], 3, aliceSecret);

const BLOCK_4_COINBASE_TRANSACTION = createTransaction([], [{
  address: alicePublic,
  amount: REWARD_AMOUNT
}], 4, aliceSecret);

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
}], 4, bruceSecret);

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
}], 4, bruceSecret);

const UNCONFIRMED_TRANSACTION = createTransaction([{
  transactionId: BLOCK_1_COINBASE_TRANSACTION.id,
  transactionOutputIndex: 0,
  signature: ''
}], [{
  address: brucePublic,
  amount: 50
}], 2, aliceSecret);

describe('transaction', () => {
  describe('validateCoinbaseTransaction', () => {
    it('valiades successfully', () => {
      expect(validateCoinbaseTransaction(BLOCK_1_COINBASE_TRANSACTION)).toBe(true);
    })
  })
  describe('creating transactions', () => {
    const transactionWithId = {
      ...BLOCK_2_ALICE_SENDS_TO_BRUCE,
      id: generateTransactionID(BLOCK_2_ALICE_SENDS_TO_BRUCE)
    };
    const signedTransaction = signTransactionInputs(transactionWithId, aliceSecret);
    it('signTransactionInputs', () => {
      expect(BLOCK_2_ALICE_SENDS_TO_BRUCE.inputs[0].signature.length).toBeGreaterThan(100);
    })
    it('validateTransaction', () => {
      expect(validateTransaction(signedTransaction, createUnspentTransactionOutputs(BLOCK_1_COINBASE_TRANSACTION), [])).toBe(true)
    })
    it('validateTransaction should return false if a referenced output is already among unconfirmed transactions', () => {
      expect(() =>
        validateTransaction(signedTransaction, createUnspentTransactionOutputs(BLOCK_1_COINBASE_TRANSACTION), [UNCONFIRMED_TRANSACTION])
      ).toThrowError('Transaction references an output already used by another unconfirmed transaction')
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
      expect(balanceOfAddress(blockChain, alicePublic)).toBe(197);
      expect(balanceOfAddress(blockChain, brucePublic)).toBe(3);
    });
    it.skip('can spend from the yet-to-be-mined block', () => {
      // TODO: does this need to work?
      const block1 = createBlock([BLOCK_1_COINBASE_TRANSACTION], GENESIS_BLOCK.hash)
      const block2 = createBlock([BLOCK_2_COINBASE_TRANSACTION, BLOCK_2_ALICE_SENDS_TO_BRUCE], block1.hash);
      const block3 = createBlock([BLOCK_3_COINBASE_TRANSACTION, BLOCK_3_ALICE_SENDS_TO_BRUCE], block2.hash);
      const block4 = createBlock([BLOCK_4_COINBASE_TRANSACTION, BLOCK_4_BRUCE_SENDS_TO_ALICE, BLOCK_4_ALICE_SENDS_SOME_BACK], block3.hash);
      const blockChain = [
        GENESIS_BLOCK,
        block1,
        block2,
        block3,
        block4
      ];
      expect(validateChain(blockChain)).toBe(true);
      expect(balanceOfAddress(blockChain, alicePublic)).toBe(195);
      expect(balanceOfAddress(blockChain, brucePublic)).toBe(5);
    })
  })
})