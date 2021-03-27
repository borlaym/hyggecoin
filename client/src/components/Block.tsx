import React from 'react';
import { Block } from '../../../src/block';
import { Transaction } from '../../../src/transaction';

type Props = {
  block: Block<Transaction[]>
}

export default function BlockComponent({ block }: Props) {
  return (
    <div>
      <p>Hash: {block.hash}</p>
    </div>
  )
}