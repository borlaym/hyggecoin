import React from 'react';
import DataProvider from './components/DataProvider';
import Layout from './components/Layout';
import { HashRouter, Switch, Route } from 'react-router-dom';
import BlockList from './components/BlockList';
import Wallet from './components/Wallet';
import MyWallet from './components/MyWallet';
import Mine from './components/Mine';
import CreateTransaction from './components/CreateTransaction';

export default function App() {

  return (
    <DataProvider>
      <HashRouter>
        <Layout>
            <Switch>
              <Route path="/chain-explorer">
                <BlockList />
              </Route>
              <Route path="/wallet" exact>
                <MyWallet />
              </Route>
              <Route path="/wallet/:address">
                <Wallet />
              </Route>
              <Route path="/create-transaction">
                <CreateTransaction />
              </Route>
              <Route path="/mine">
                <Mine />
              </Route>
            </Switch>
        </Layout>
      </HashRouter>
    </DataProvider>
  )
}