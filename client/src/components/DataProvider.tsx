import React, { createContext, useEffect, useMemo, useState } from "react";
import { Block, Chain } from "../../../src/block";
import { Transaction } from "../../../src/transaction";
import firebase from 'firebase/app';
import 'firebase/database';

const GENESIS_BLOCK: Block<Transaction[]> = {
  previousHash: '0',
  hash: '71ce399acfbec8338142fe71828dbadd901cbc96c907d67ea61110dc08b272ae',
  timestamp: 0,
  data: [],
  nonce: 1
};

const firebaseApp = firebase.initializeApp({
  apiKey: "AIzaSyCRBU7LClPN4lRzI1GnwPPo_grSmScxwbg",
  authDomain: "hyggecoin.firebaseapp.com",
  databaseURL: "https://hyggecoin-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hyggecoin",
  storageBucket: "hyggecoin.appspot.com",
  messagingSenderId: "634436645550",
  appId: "1:634436645550:web:9d685b017f569b207e733f"
});

const database = firebaseApp.database();

const chainRef = database.ref('/chain');
const transactionsRef = database.ref('/transactions');

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

  useEffect(() => {
    chainRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setChain(Object.values(data));
      } else {
        setChain([]);
      }
    });

    transactionsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUnconfirmedTransactions(Object.values(data));
      } else {
        setUnconfirmedTransactions([]);
      }
    });
  }, []);

  const value = useMemo(() => ({
    chain: [GENESIS_BLOCK, ...chain],
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