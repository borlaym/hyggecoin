import { makeStyles, Card, CardContent, Accordion, AccordionSummary, AccordionDetails, Grid } from '@material-ui/core';
import React from 'react';
import { Block } from '../../../src/block';
import { Transaction } from '../../../src/transaction';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import TransactionComponent from './Transaction';

type Props = {
  block: Block<Transaction[]>;
  index: number;
}

const useStyles = makeStyles({
  hash: {
    fontSize: 12
  }
});

const difficultyRegex = /^0+/;

export default function BlockComponent({ block, index }: Props) {
  const classes = useStyles();
  const difficulty = difficultyRegex.exec(block.hash);
  return (
    <Card>
      <CardContent>
        <Typography component="h2" variant="h6" color="textSecondary" gutterBottom>
          Block {index}
        </Typography>
        <Typography color="textSecondary" className={classes.hash}>
          {block.hash}
        </Typography>
        <Typography color="textSecondary" className={classes.hash} gutterBottom>
          Difficulty: {difficulty ? difficulty[0].length : 0}
        </Typography>
        <Typography color="textSecondary" className={classes.hash} gutterBottom>
          {new Date(block.timestamp).toLocaleString()}
        </Typography>

      </CardContent>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography color="textSecondary">{block.data.length} transaction{block.data.length === 1 ? '' : 's'}</Typography>
          </AccordionSummary>
          <AccordionDetails>
              <Grid container spacing={1}>
                {block.data.map(transaction => (
                  <Grid item xs={12}>
                    <TransactionComponent key={transaction.id} transaction={transaction} />
                  </Grid>
                ))}
              </Grid>
          </AccordionDetails>
        </Accordion>

    </Card>
  )
}