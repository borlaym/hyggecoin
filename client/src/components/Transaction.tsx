import { Card, CardContent, Divider, makeStyles, Typography } from '@material-ui/core';
import React, { useContext } from 'react';
import { getSenderAddress, Transaction } from '../../../src/transaction';
import { DataContext } from './DataProvider';

type Props = {
  transaction: Transaction;
}

const useStyles = makeStyles({
  hash: {
    fontSize: 12
  }
});



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