import { Grid } from "@material-ui/core";
import React, { useContext, useMemo } from "react";
import BlockComponent from "./Block";
import { DataContext } from "./DataProvider";

export default function BlockList() {
  const chain = useContext(DataContext);

  const reversedChain = useMemo(() => [...chain].reverse(), [chain]);

  return (
    <Grid container spacing={2}>
      {reversedChain.map((block, i) => (
        <Grid item lg={6}>
          <BlockComponent block={block} key={block.hash} index={reversedChain.length - i} />
        </Grid>
      ))}
    </Grid>
  )
}