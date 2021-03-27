import React, { createContext, useCallback, useEffect, useState } from "react";
import { Chain } from "../../../src/block";
import { Transaction } from "../../../src/transaction";

const DataContext = createContext<Chain<Transaction[]>>([]);

export default function DataProvider({ children }: { children: React.ReactElement}): React.ReactElement {

  const [chain, setChain] = useState([]);

  const fetchChain = useCallback(() => {
    fetch('http://localhost:9000/chain', {
      mode: 'cors',
      credentials: 'omit'
    })
      .then(response => response.json())
      .then(response => setChain(response.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetchChain()
    setInterval(fetchChain, 20 * 1000);
  }, [fetchChain]);

  return (
    <DataContext.Provider value={chain}>
      {children}
    </DataContext.Provider>
  );
}

export {
  DataContext
};