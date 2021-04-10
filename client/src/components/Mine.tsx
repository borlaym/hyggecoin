import { FormControl, Grid, makeStyles, MenuItem, Paper, Select, Typography } from "@material-ui/core";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { post } from "../utils/getJson";
import { Block, createBlock, getDifficultyForNextBlock } from "../../../src/block";
import { createCoinbaseTransaction, dataSerializer, Transaction } from "../../../src/transaction";
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
  },
  text: {
    display: 'flex',
    alignItems: 'center'
  },
  select: {
    marginLeft: '1em'
  }
}));

export default function BlockList() {
  const { chain, unconfirmedTransactions } = useContext(DataContext);
  const classes = useStyles();
  const publicKey = localStorage.getItem('publicKey');
  const secretKey = localStorage.getItem('secret');
  const [hashCount, setHashCount] = useState(0);
  const [block, setBlock] = useState<Block<Transaction[]> | null>(null);
  const [solutions, setSolutions] = useState(0);
  const [cores, setCores] = useState(1);
  const workers = useRef<Worker[] | null>(null);
  const progressInfo = useRef<Array<{ timestamp: number; count: number; }>>([]);

  const data = useMemo(() => {
    if (!unconfirmedTransactions || chain.length === 0 || !secretKey || !publicKey) {
      return null;
    }
    const coinbaseTransaction = createCoinbaseTransaction(chain.length, publicKey, secretKey);
    const unminedBlock = createBlock([coinbaseTransaction, ...unconfirmedTransactions], chain[chain.length - 1].hash, dataSerializer);
    const difficulty = getDifficultyForNextBlock(chain);

    return {
      chain,
      unconfirmedTransactions,
      coinbaseTransaction,
      unminedBlock,
      difficulty
    }
  }, [chain, unconfirmedTransactions, publicKey, secretKey]);

  /**
   * Update internal values / get the mined block when events are sent from workers
   */
  const onWorkerEvent = useCallback((event: MessageEvent<WorkerEvent>) => {
    const workerEvent = event.data;
    if (workerEvent.type === 'count') {
      setHashCount(count => count + workerEvent.count);
    } else if (workerEvent.type === 'solution') {
      console.log(workerEvent.block)
      setBlock(workerEvent.block);
    }
  }, []);

  /**
   * Setup / reset miners when new data is available
   */
  useEffect(() => {
    if (data?.unminedBlock && data?.difficulty && !block) {
      const newWorkers = []
      for (let i = 0; i < cores; i++) {
        const miner = new Miner();
        miner.postMessage({
          unminedBlock: data.unminedBlock,
          difficulty: data.difficulty
        });
        miner.onmessage = onWorkerEvent;
        newWorkers.push(miner);
      }
      workers.current = newWorkers;
    }
    return () => {
      if (workers.current) {
        console.log('terminating all workers');
        workers.current.forEach(worker => worker.terminate());
      }
    }
  }, [data, onWorkerEvent, block, cores]);

  /**
   * Send a mined block when ready to the server and reset state
   */
  useEffect(() => {
    if (block) {
      post('/mine-block', block).then((res) => {
        if (res === 'success') {
          setSolutions(solutions => solutions + 1);
        }
        setHashCount(0);
        setBlock(null);
        progressInfo.current = []
      })
      .catch(err => {
        console.log(err);
        setHashCount(0);
        setBlock(null);
        progressInfo.current = []
      });
    }
  }, [block]);

  const handleCoresChange = useCallback((event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>) => {
    setCores(event.target.value as number);
  }, [])

  /**
   * Update the progressinfo array with the latest count, so we can calculate a rolling average of hashes / s
   */
  useEffect(() => {
    progressInfo.current = [...progressInfo.current, { timestamp: Date.now(), count: hashCount }];
    if (progressInfo.current.length > 200) {
      progressInfo.current = progressInfo.current.slice(-200);
    }
  }, [hashCount]);

  if (!unconfirmedTransactions) {
    return <>Loading...</>
  }

  if (!secretKey || !publicKey) {
    return <>Please specify your public and secret keys in your Wallet</>;
  }

  /**
   * Calculate a rolling average of the hashrate
   */
  const hashRate = progressInfo.current.length >= 2 ?
    (progressInfo.current[progressInfo.current.length - 1].count - progressInfo.current[0].count) / ((progressInfo.current[progressInfo.current.length - 1].timestamp - progressInfo.current[0].timestamp) / 1000) :
    null;

  return (
    <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>Mine block</Typography>
            <Typography component="h3" variant="h6" color="textSecondary" gutterBottom>Block will include {unconfirmedTransactions.length} transactions</Typography>
            {data?.difficulty && <Typography component="h3" variant="h6" color="textSecondary" gutterBottom>Difficulty: {data.difficulty}</Typography>}
            <Typography component="h3" variant="h6" color="textSecondary" gutterBottom className={classes.text}>Number of cores used <FormControl variant="outlined">
              <Select
                labelId="demo-simple-select-error-label"
                id="demo-simple-select-error"
                value={cores}
                onChange={handleCoresChange}
                className={classes.select}
              >
                {(new Array(navigator.hardwareConcurrency).fill(true).map((_, i) => i+1)).map(item => {
                  return <MenuItem value={item} key={item}>{item}</MenuItem>
                })}
              </Select>
            </FormControl></Typography>

            {hashCount > 0 && <Typography component="h3" variant="h6" color="textSecondary" gutterBottom>Mining in progress, tries: {hashCount}, hash rate: {hashRate && Math.floor(hashRate / 1000)} khashes/s</Typography>}
            {solutions > 0 && <Typography component="h3" variant="h6" color="textSecondary" gutterBottom>Solutions: {solutions}</Typography>}
          </Paper>
        </Grid>
    </Grid>
  )
}