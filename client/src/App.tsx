import React, { useEffect, useState } from 'react';
import { Chain } from '../../src/block';
import { Transaction } from '../../src/transaction';
import BlockComponent from './components/Block';

export default function App() {
  const [chain, setChain] = useState<Chain<Transaction[]> | null>(null);

  useEffect(() => {
    fetch('http://localhost:9000/chain')
      .then(response => response.json())
      .then(response => setChain(response.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      {chain?.map(block => <BlockComponent block={block} key={block.hash} />)}
    </div>
  )
}