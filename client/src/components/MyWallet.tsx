import { Grid, makeStyles, Paper, TextField, Typography } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    wordBreak: 'break-all'
  }
}));


export default function MyWallet() {
  const classes = useStyles();
  const [publicKey, setPublicKey] = useState(localStorage.getItem('publicKey') || '');
  const [secret, setSecret] = useState(localStorage.getItem('secret') || '');

  useEffect(() => {
    localStorage.setItem('publicKey', publicKey);
    localStorage.setItem('secret', secret);
  }, [publicKey, secret]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Paper className={classes.paper}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>My Wallet</Typography>
          <Typography component="h3" variant="h6" color="textSecondary" gutterBottom>Set your wallet details</Typography>
          <TextField label="Public key" variant="outlined" value={publicKey} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPublicKey(event.target.value)} margin="normal" />
          <TextField label="Secret key" variant="outlined" value={secret} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSecret(event.target.value)} margin="normal" />
          {publicKey && <Link to={`/wallet/${publicKey}`}>Go to wallet</Link>}
        </Paper>
      </Grid>
    </Grid>
  )
}