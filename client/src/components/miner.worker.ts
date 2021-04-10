import { Block, getHashBase } from "../../../src/block";
import { dataSerializer, Transaction } from "../../../src/transaction";
import crypto from 'crypto-js';

export type WorkerEvent = {
  type: 'count',
  count: number
} | {
  type: 'solution',
  block: Block<Transaction[]>
};

export function getHash(content: string): string {
  const hash = crypto.SHA256(content);
  return hash.toString(crypto.enc.Hex)
}

export function calculateBlockHash(block: Block<Transaction[]>): string {
  return getHash(getHashBase(block, dataSerializer));
}

export function updateHash(block: Block<Transaction[]>): Block<Transaction[]> {
  return { ...block, hash: calculateBlockHash(block) };
}

export function randomNonce(block: Block<Transaction[]>): Block<Transaction[]> {
  return updateHash({ ...block, nonce: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) })
}

export function checkDifficulty(difficulty: number, hash: string): boolean {
  return hash.substr(0, difficulty) === "0".repeat(difficulty)
}

export function mineBlock(difficulty: number, block: Block<Transaction[]>) {
  let counter = 0;
  let finishedBlock = block;
  while (!checkDifficulty(difficulty, finishedBlock.hash)) {
    finishedBlock = randomNonce(finishedBlock);
    counter++;
    if (counter % 1000 === 0) {
      (postMessage as any)({
        type: 'count',
        count: counter
      });
      counter = 0;
    }
  }
  (postMessage as any)({
    type: 'count',
    count: counter
  });
  (postMessage as any)({
    type: 'solution',
    block: finishedBlock
  });
  return finishedBlock;
}

onmessage = function (event: MessageEvent<{
  unminedBlock: Block<Transaction[]>,
  difficulty: number
}>) {
  console.log('worker started');
  mineBlock(event.data.difficulty, event.data.unminedBlock);
}
