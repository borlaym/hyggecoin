import { balanceOfAddress, calculateUnspentOutputs, createTransaction, createUnspentTransactionOutputs, generateTransactionID, REWARD_AMOUNT, signTransactionInputs, Transaction, unspentTransactionsOfAddress, validateCoinbaseTransaction, validateTransaction } from "./transaction"
import { generateKeys } from "./wallet"
import { Block, createBlock, validateChain } from "./block";

const GENESIS_BLOCK: Block<Transaction[]> = {
  previousHash: '0',
  hash: '71ce399acfbec8338142fe71828dbadd901cbc96c907d67ea61110dc08b272ae',
  timestamp: 0,
  data: [],
  nonce: 1
};

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
      expect(validateTransaction(signedTransaction, createUnspentTransactionOutputs(BLOCK_1_COINBASE_TRANSACTION))).toBe(true)
    })
  })
  describe('calculating unspent outputs', () => {
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
  })
})