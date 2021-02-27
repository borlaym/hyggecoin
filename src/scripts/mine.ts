import { Chain, createBlock, mineBlock } from '../block';
import { Transaction } from '../transaction';
import { createCoinbaseTransaction } from '../transaction';
import commandLineArgs from 'command-line-args';
import { get } from '../utils/api';
import { post } from '../utils/api';

const optionDefinitions = [
  { name: 'publicKey', alias: 'p' },
  { name: 'secretKey', alias: 's' }
]

const options = commandLineArgs(optionDefinitions);

if (!options.publicKey || !options.secretKey) {
  throw new Error("Keys need to be specified")
}

Promise.all([
  get('/chain'),
  get('/unconfirmed-transactions')
]).then((responses) => {
  const [chain, transactions]: [Chain<Transaction[]>, Transaction[]] = responses;
  const coinbaseTransaction = createCoinbaseTransaction(chain.length, options.publicKey, options.secretKey);
  const block = createBlock([coinbaseTransaction, ...transactions], chain[chain.length - 1].hash);
  const minedBlock = mineBlock(2, block);
  post('/mine-block', minedBlock)
    .then(res => console.log(res))
    .catch(err => console.error(err));
})
  .catch(err => console.error(err))