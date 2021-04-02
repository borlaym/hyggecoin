import { Grid, makeStyles, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@material-ui/core";
import React, { useContext, useMemo } from "react";
import { useParams } from "react-router";
import { balanceOfAddress, getSenderAddress, getTransactionsOfAddress } from "../../../src/transaction";
import { DataContext } from "./DataProvider";
import { shortAddress } from "./Transaction";
import { Link } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    wordBreak: 'break-all'
  }
}));



export default function Wallet() {
  const { address } = useParams<{ address: string }>();
  const { chain } = useContext(DataContext);
  const classes = useStyles();
  const balance = chain.length > 0 ? balanceOfAddress(chain, [], address) : null;
  const transactions = useMemo(() => {
    return getTransactionsOfAddress(chain, [], address).reverse();
  }, [address, chain]);

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>Wallet {address}</Typography>
            {balance !== null && <Typography component="h3" variant="h6" color="textSecondary" gutterBottom>Balance: {balance}</Typography>}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Incoming / Outgoing</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Message</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => {
                  const isCoinbase = transaction.inputs.length === 1 &&
                    transaction.outputs.length === 1 &&
                    Number.isInteger(transaction.inputs[0].transactionOutputIndex) &&
                    transaction.inputs[0].transactionId === '';
                  const isSendingToYourself = !isCoinbase && !transaction.outputs.map(o => o.address).find(a => a !== address);
                  if (isSendingToYourself) {
                    return null;
                  }
                  const senderAddress = getSenderAddress(transaction, chain);
                  const isOutgoing = senderAddress === address;
                  const relevantOutput = isOutgoing ?
                    transaction.outputs.find(output => output.address !== address) :
                    transaction.outputs.find(output => output.address === address);
                  const otherAddress = isOutgoing ? relevantOutput?.address : senderAddress;
                  const otherAddressDisplay = otherAddress ? <Link to={`/wallet/${otherAddress}`}>{shortAddress(otherAddress)}</Link> : (isCoinbase ? 'COINBASE' : '-');
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>{isOutgoing ? 'Outgoing' : 'Incoming'}</TableCell>
                      <TableCell>{otherAddressDisplay}</TableCell>
                      <TableCell align="right">{otherAddress ? relevantOutput?.amount : transaction.outputs[0].amount}</TableCell>
                      <TableCell>{transaction.message}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </>
  )
}