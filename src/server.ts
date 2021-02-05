const crypto = require('crypto');

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

function calculateHash({
  previousHash,
  timestamp,
  data,
  nonce
}: Block) {
  const hash = crypto.createHash('sha256');
  hash.update(previousHash + timestamp + JSON.stringify(data) + nonce);
  return hash.digest('hex');
}

function updateHash(block: Block) {
  return { ...block, hash: calculateHash(block) };
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

const newBlock = mineBlock(4, {
  previousHash: '71ce399acfbec8338142fe71828dbadd901cbc96c907d67ea61110dc08b272ae',
  hash: '',
  timestamp: Date.now(),
  data: {
    name: 'Marci'
  },
  nonce: 1
});

function addBlock(chain: Chain, data: Data) {
  const { hash: previousHash } = chain[chain.length - 1];
  const block: Block = {
    timestamp: + new Date(),
    data,
    previousHash,
    hash: '',
    nonce: 0
  }
  const newBlock = mineBlock(4, block);
  return [...chain, newBlock];
}

function validateChain(chain: Chain) {
  return chain.map((block, i) => {
    if (i === 0) {
      return true;
    }
    return (block.hash === calculateHash(block) && block.previousHash === chain[i -1].hash);
  }).filter(isValid => !isValid).length === 0;
}

const chain = [GENESIS_BLOCK];

const newBlockData = {
  sender: 'Marci',
  receiver: 'John Doe',
  amount: 4
};

const newChain = addBlock(chain, newBlockData);
console.log(newChain);
console.log(validateChain(newChain));