import { Card, CardContent, Divider, makeStyles, Typography } from '@material-ui/core';
import React, { useContext } from 'react';
import { Transaction } from '../../../src/transaction';
import { DataContext } from './DataProvider';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import { Chain } from '../../../src/block';

type Props = {
  transaction: Transaction;
}

const useStyles = makeStyles({
  hash: {
    fontSize: 12
  }
});

/**
 * Find the sender's address based on the inputs of the transaction
 */
 function getSenderAddress(transaction: Transaction, chain: Chain<Transaction[]>): string | null {
  const sampleInput = transaction.inputs[0];
  if (!sampleInput.transactionId) {
    return null;
  }
  const outputTransactionBlock = chain.find(block => block.data.find(transaction => transaction.id === sampleInput.transactionId));
  const outputTransaction = outputTransactionBlock?.data.find(transaction => transaction.id === sampleInput.transactionId);
  const output = outputTransaction?.outputs[sampleInput.transactionOutputIndex];
  return output?.address || null;
}

function shortAddress(hash: string): string {
  return `${hash.substr(0, 8)}...${hash.substr(-8)}`;
}


export default function TransactionComponent({ transaction }: Props) {
  const classes = useStyles();
  const chain = useContext(DataContext);

  const sender = getSenderAddress(transaction, chain);

  return (
    <>
      <Card>
        <CardContent>
          <Typography color="textSecondary" className={classes.hash}>{transaction.id}</Typography>
          <Typography>
            {transaction.outputs.map((output, i) => (
              <div key={i}>
                <strong>{sender ? shortAddress(sender) : 'COINBASE'}</strong> &gt; <strong>{shortAddress(output.address)}</strong> for <strong>{output.amount}</strong> coins
              </div>
            ))}
          </Typography>
          {transaction.message && (
            <Typography>
              Included message: "{transaction.message}"
            </Typography>
          )}
        </CardContent>
      </Card>
      <Divider />
    </>
  )
}