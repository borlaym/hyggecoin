import { Card, CardContent, Divider, makeStyles, Typography } from '@material-ui/core';
import React from 'react';
import { Transaction } from '../../../src/transaction';

type Props = {
  transaction: Transaction;
}

const useStyles = makeStyles({
  hash: {
    fontSize: 12
  }
});

export default function TransactionComponent({ transaction }: Props) {
  const classes = useStyles();
  return (
    <>
      <Card>
        <CardContent>
          <Typography color="textSecondary" className={classes.hash}>{transaction.id}</Typography>
        </CardContent>
      </Card>
      <Divider />
    </>
  )
}