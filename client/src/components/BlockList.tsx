import React, { useContext } from "react";
import BlockComponent from "./Block";
import { DataContext } from "./DataProvider";

export default function BlockList() {
  const chain = useContext(DataContext);
  return <>
    {chain.map(block => <BlockComponent block={block} key={block.hash} />)}
  </>
}