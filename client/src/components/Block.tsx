import { makeStyles, Card, CardContent, Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core';
import React from 'react';
import { Block } from '../../../src/block';
import { Transaction } from '../../../src/transaction';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

type Props = {
  block: Block<Transaction[]>;
  index: number;
}

const useStyles = makeStyles({
  hash: {
    fontSize: 12
  }
});

export default function BlockComponent({ block, index }: Props) {
  const classes = useStyles();
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
          {new Date(block.timestamp).toLocaleString()}
        </Typography>

      </CardContent>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography color="textSecondary">Transactions</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              TODO list transactions here
            </Typography>
          </AccordionDetails>
        </Accordion>

    </Card>
  )
}