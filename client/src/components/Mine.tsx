import { Grid, makeStyles, Paper, Typography } from "@material-ui/core";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { post } from "../utils/getJson";
import { Block, checkDifficulty, createBlock, getDifficultyForNextBlock, nextNonce } from "../../../src/block";
import { createCoinbaseTransaction, Transaction } from "../../../src/transaction";
import { DataContext } from "./DataProvider";
// eslint-disable-next-line import/no-webpack-loader-syntax
import Miner from 'worker-loader!./miner.worker';
import { WorkerEvent } from "./miner.worker";

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    wordBreak: 'break-all'
  }
}));

export default function BlockList() {
  const { chain, unconfirmedTransactions } = useContext(DataContext);
  const classes = useStyles();
  const publicKey = localStorage.getItem('publicKey');
  const secretKey = localStorage.getItem('secret');
  const [hashCount, setHashCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [block, setBlock] = useState<Block<Transaction[]> | null>(null);
  const [solutions, setSolutions] = useState(0);
  const worker = useRef<Worker | null>(null);

  const data = useMemo(() => {
    if (!unconfirmedTransactions || chain.length === 0) {
      return null;
    }
    const coinbaseTransaction = createCoinbaseTransaction(chain.length, publicKey || '', secretKey || '');
    const unminedBlock = createBlock([coinbaseTransaction, ...unconfirmedTransactions], chain[chain.length - 1].hash);
    const difficulty = getDifficultyForNextBlock(chain);

    return {
      chain,
      unconfirmedTransactions,
      coinbaseTransaction,
      unminedBlock,
      difficulty
    }
  }, [chain, unconfirmedTransactions, publicKey, secretKey]);

  const onWorkerEvent = useCallback((event: MessageEvent<WorkerEvent>) => {
    const workerEvent = event.data;
    if (workerEvent.type === 'count') {
      setHashCount(count => count + workerEvent.count);
    } else if (workerEvent.type === 'solution') {
      console.log(workerEvent.block)
      setBlock(workerEvent.block);
    }
  }, []);

  useEffect(() => {
    if (data?.unminedBlock && data?.difficulty) {
      const miner = new Miner();
      miner.postMessage({
        unminedBlock: data.unminedBlock,
        difficulty: data.difficulty
      });
      miner.onmessage = onWorkerEvent;
      worker.current = miner;
      setStartTime(startTime => startTime === null ? Date.now() : startTime);
    }
    return () => {
      if (worker.current) {
        worker.current.terminate();
      }
    }
  }, [data, onWorkerEvent]);

  useEffect(() => {
    if (block) {
      post('/mine-block', block).then((res) => {
        if (res === 'success') {
          setSolutions(solutions => solutions + 1);
        }
        setHashCount(0);
        setBlock(null);
        setStartTime(null)
      })
      .catch(err => {
        console.log(err);
        setHashCount(0);
        setBlock(null);
        setStartTime(null)
      });
    }
  }, [block]);

  if (!unconfirmedTransactions) {
    return <>Loading...</>
  }

  if (!secretKey || !publicKey) {
    return <>Please specify your public and secret keys in your Wallet</>;
  }

  const elapsedTimeInSeconds = startTime !== null ? (Date.now() - startTime) / 1000 : null

  return (
    <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>Mine block</Typography>
            <Typography component="h3" variant="h6" color="textSecondary" gutterBottom>Block will include {unconfirmedTransactions.length} transactions</Typography>
            {data?.difficulty && <Typography component="h3" variant="h6" color="textSecondary" gutterBottom>Difficulty: {data.difficulty}</Typography>}
            {hashCount > 0 && <Typography component="h3" variant="h6" color="textSecondary" gutterBottom>Mining in progress, tries: {hashCount}, hash rate: {elapsedTimeInSeconds && Math.floor(hashCount / elapsedTimeInSeconds)} hash/s</Typography>}
            {solutions > 0 && <Typography component="h3" variant="h6" color="textSecondary" gutterBottom>Solutions: {solutions}</Typography>}
          </Paper>
        </Grid>
    </Grid>
  )
}