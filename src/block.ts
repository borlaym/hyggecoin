import { getHash } from "./util";

type Data = {
  [key: string]: any
}

type Block = {
  previousHash: string;
  hash: string;
  timestamp: number;
  data: Data;
  nonce: number
}

type Chain = Block[];

const GENESIS_BLOCK: Block = {
  previousHash: '0',
  hash: '71ce399acfbec8338142fe71828dbadd901cbc96c907d67ea61110dc08b272ae',
  timestamp: 0,
  data: {},
  nonce: 1
};



function calculateBlockHash({
  previousHash,
  timestamp,
  data,
  nonce
}: Block) {
  return getHash(previousHash + timestamp + JSON.stringify(data) + nonce);
}

function updateHash(block: Block) {
  return { ...block, hash: calculateBlockHash(block) };
}

function nextNonce(block: Block) {
  return updateHash({ ...block, nonce: block.nonce + 1 })
}

function checkDifficulty(difficulty: number, hash: string) {
  return hash.substr(0, difficulty) === "0".repeat(difficulty)
}

function mineBlock(difficulty: number, block: Block) {
  let finishedBlock = block;
  while (!checkDifficulty(difficulty, finishedBlock.hash)) {
    finishedBlock = nextNonce(finishedBlock);
    console.log(finishedBlock.nonce, finishedBlock.hash);
  }
  return finishedBlock;
}

function addBlock(chain: Chain, data: Data) {
  const { hash: previousHash } = chain[chain.length - 1];
  const block: Block = {
    timestamp: + new Date(),
    data,
    previousHash,
    hash: '',
    nonce: 0
  }
  const newBlock = mineBlock(2, block);
  return [...chain, newBlock];
}

function validateChain(chain: Chain) {
  return chain.map((block, i) => {
    if (i === 0) {
      return true;
    }
    return (block.hash === calculateBlockHash(block) && block.previousHash === chain[i -1].hash);
  }).filter(isValid => !isValid).length === 0;
}