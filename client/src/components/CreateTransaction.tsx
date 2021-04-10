import { Button, Grid, makeStyles, Paper, TextField, Typography } from "@material-ui/core";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { post } from "../utils/getJson";
import { createTransactionForAmount, signTransaction } from "../../../src/transaction";
import { DataContext } from "./DataProvider";

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    wordBreak: 'break-all'
  }
}));


export default function CreateTransaction() {
  const classes = useStyles();
  const { chain, unconfirmedTransactions } = useContext(DataContext);
  const publicKey = localStorage.getItem('publicKey');
  const secretKey = localStorage.getItem('secret');
  const [data, setData] = useState({
    recipient: '',
    amount: 0
  });

  const handleRecipientChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setData(data => ({
      ...data,
      recipient: event.target.value
    }));
  }, []);

  const handleAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setData(data => ({
      ...data,
      amount: parseInt(event.target.value)
    }));
  }, []);

  const transaction = useMemo(() => {
    if (!unconfirmedTransactions || chain.length === 0 || !publicKey || !secretKey || !data.recipient || !data.amount) {
      return null;
    }
    const unsignedTransaction = createTransactionForAmount(chain, unconfirmedTransactions, publicKey, data.recipient, '', data.amount);
    return signTransaction(unsignedTransaction, secretKey);
  }, [chain, data.amount, data.recipient, publicKey, secretKey, unconfirmedTransactions]);

  const send = useCallback(() => {
    post('/add-transaction', transaction).then((res) => {
      if (res === 'success') {
        setData({
          recipient: '',
          amount: 0
        })
      }
    })
    .catch(err => {
      console.log(err);
    });
  }, [transaction])

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Paper className={classes.paper}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>Create Transaction</Typography>
          <TextField label="Recipient address" variant="outlined" value={data.recipient} onChange={handleRecipientChange} margin="normal" />
          <TextField label="Amount" variant="outlined" value={data.amount} onChange={handleAmountChange} margin="normal" />
          <Button onClick={send} disabled={!transaction}>Send coins</Button>
        </Paper>
      </Grid>
    </Grid>
  )
}