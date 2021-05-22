import { Block, Chain, checkDifficulty } from '../block';
import commandLineArgs from 'command-line-args';
import { getHash } from '../util';
import { Transaction } from '../transaction';
import { get } from '../utils/api';

const optionDefinitions = [
  { name: 'publicKey', alias: 'p' },
  { name: 'secretKey', alias: 's' }
]

const options = commandLineArgs(optionDefinitions);

if (!options.publicKey || !options.secretKey) {
  throw new Error("Keys need to be specified")
}

type Thing = {
  publicKey: string;
  wikiDataId: number;
  hash: string;
  blockHash: string;
}

function mineThing(difficulty: number, publicKey: string, blockHash: string, max: number = 20000): Thing | null {
  let finishedThing: Thing = {
    publicKey,
    wikiDataId: 0,
    hash: '',
    blockHash
  };
  while (!checkDifficulty(difficulty, finishedThing.hash) && finishedThing.wikiDataId < 20000) {
    const newId = finishedThing.wikiDataId + 1;
    finishedThing = { ...finishedThing, wikiDataId: newId, hash: getHash(publicKey + newId + blockHash)};
    console.log(finishedThing.wikiDataId, finishedThing.hash);
  }
  if (finishedThing.wikiDataId < 20000) {
    return finishedThing;
  }
  return null;
}

get('/chain').then((chain: Chain<Transaction>) => {
  let thing: Thing | null = null;
  let index = 2;
  while (!thing && index < chain.length) {
    thing = mineThing(5, options.publicKey, chain[index].hash);
    if (!thing) {
      index = index + 1;
    }
  }
  console.log(thing);
})