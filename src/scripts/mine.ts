import fetch from 'node-fetch';
import { Block, Chain, createBlock, mineBlock } from '../block';
import { Transaction } from '../transaction';
import { createCoinbaseTransaction } from '../transaction';
import commandLineArgs from 'command-line-args';

const optionDefinitions = [
  { name: 'publicKey', alias: 'p' },
  { name: 'secretKey', alias: 's' }
]

const options = commandLineArgs(optionDefinitions);

fetch('http://localhost:9000/chain')
  .then(res => res.json())
  .then(res => res.data)
  .then((chain: Chain<Transaction[]>) => {
    const coinbaseTransaction = createCoinbaseTransaction(chain.length, options.publicKey, options.secretKey);
    const block = createBlock([coinbaseTransaction], chain[chain.length - 1].hash);
    const minedBlock = mineBlock(2, block);
    fetch('http://localhost:9000/mine-block', { method: 'POST', headers: {
      'Content-Type': 'application/json'
    }, body: JSON.stringify(minedBlock)})
      .then(res => res.json())
      .then(res => console.log(res))
      .catch(err => console.error(err));
  })
  .catch(err => console.error(err))