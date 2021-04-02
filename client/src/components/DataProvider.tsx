import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import getJson from "../utils/getJson";
import { Chain } from "../../../src/block";
import { Transaction } from "../../../src/transaction";

const DataContext = createContext<{
  chain: Chain<Transaction[]>,
  unconfirmedTransactions: Transaction[] | null
}>({
  chain: [],
  unconfirmedTransactions: null
});

export default function DataProvider({ children }: { children: React.ReactElement}): React.ReactElement {

  const [chain, setChain] = useState<Chain<Transaction[]>>([]);
  const [unconfirmedTransactions, setUnconfirmedTransactions] = useState<Transaction[] | null>(null);

  const fetchChain = useCallback(() => {
    getJson<Chain<Transaction[]>>('/chain').then(data => setChain(data));
  }, []);

  const fetchUnconfirmedTransactions = useCallback(() => {
    getJson<Transaction[]>('/unconfirmed-transactions').then(data => setUnconfirmedTransactions(data));
  }, []);

  const fetchAllData = useCallback(() => {
    fetchChain()
    fetchUnconfirmedTransactions();
  }, [fetchChain, fetchUnconfirmedTransactions]);

  useEffect(() => {
    fetchAllData();
    setInterval(fetchAllData, 20 * 1000);
  }, [fetchAllData]);

  const value = useMemo(() => ({
    chain,
    unconfirmedTransactions
  }), [chain, unconfirmedTransactions])

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export {
  DataContext
};