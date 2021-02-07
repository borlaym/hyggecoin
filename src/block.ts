import { getHash } from "./util";

/**
 * A single block in a blockchain
 */
export type Block<T> = {
  /**
   * Reference to the previous block. Since the blockchain is basically a linked list, this is how we know they string together.
   * Also included in the current block's hash, so that the chain can't be altered without altering all the rest of it
   */
  previousHash: string;
  /**
   * Computed from the data, timestamp, previous block's hash and nonce. Any of those change, and the hash changes.
   */
  hash: string;
  /**
   * Time of block creation
   */
  timestamp: number;
  /**
   * Arbitrary data. In a cryptocurrency, this will hold the transactions encoded in the block
   */
  data: T;
  /**
   * A random number included at the end of the content for hash calculation, that resulted in the block passing the difficulty test
   */
  nonce: number
}

/**
 * A linked list of blocks
 */
export type Chain<T> = Block<T>[];

/**
 * Calculate a block's hash based on all its other information, ensuring that you can't change the contents of the block without the hash changing
 * Uses sha256
 */
export function calculateBlockHash<T>({
  previousHash,
  timestamp,
  data,
  nonce
}: Block<T>): string {
  return getHash(previousHash + timestamp + JSON.stringify(data) + nonce);
}

/**
 * Update a block with its calculated hash and return the resulting block.
 * When you create a block, you should leave the hash empty and call this function.
 */
export function updateHash<T>(block: Block<T>): Block<T> {
  return { ...block, hash: calculateBlockHash(block) };
}

/**
 * Update the block with a new once and corresponding hash, and return the resulting block
 */
export function nextNonce<T>(block: Block<T>): Block<T> {
  return updateHash({ ...block, nonce: block.nonce + 1 })
}

/**
 * Check whether a sha256 hash matches a given difficulty, meaning whether it starts with difficulty number of 0s
 */
export function checkDifficulty(difficulty: number, hash: string): boolean {
  return hash.substr(0, difficulty) === "0".repeat(difficulty)
}

/**
 * Change the nonce property of a block until the resulting hash passes the given difficulty
 */
export function mineBlock<T>(difficulty: number, block: Block<T>) {
  let finishedBlock = block;
  while (!checkDifficulty(difficulty, finishedBlock.hash)) {
    finishedBlock = nextNonce(finishedBlock);
    console.log(finishedBlock.nonce, finishedBlock.hash);
  }
  return finishedBlock;
}

/**
 * Helper for creating a block with a calculated hash
 */
export function createBlock<T>(data: T, previousHash: string): Block<T> {
  return updateHash({
    timestamp: Date.now(),
    data,
    previousHash,
    hash: '',
    nonce: 0
  });
}

/**
 * Validates a chain, ensuring that all blocks' hash are correct and they chain together
 */
export function validateChain<T>(chain: Chain<T>) {
  return chain.map((block, i) => {
    if (i === 0) {
      return true;
    }
    return (block.hash === calculateBlockHash(block) && block.previousHash === chain[i -1].hash);
  }).filter(isValid => !isValid).length === 0;
}