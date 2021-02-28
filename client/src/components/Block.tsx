import React from 'react';
import { Block } from '../../../src/block';
import { Transaction } from '../../../src/transaction';
import styled from 'styled-components';

type Props = {
  block: Block<Transaction[]>
}

const Container = styled.div`
  border: 1px solid black;
  padding: 1em;
`;

export default function BlockComponent({ block }: Props) {
  return (
    <Container>
      <p>Hash: {block.hash}</p>
    </Container>
  )
}