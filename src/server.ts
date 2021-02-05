const crypto = require('crypto');

type Block = {
  previousHash: string;
  hash: string;
  timestamp: number;
  data: { [key: string]: any };
  nonce: number
}

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

function generateGenesisBlock(): Block {
  const block = {
    timestamp: 0,
    data: {},
    previousHash: "",
    nonce: 1,
    hash: ""
  };
  return {
    ...block,
    hash: calculateHash(block)
  }
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

console.log(newBlock);