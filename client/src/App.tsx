import React from 'react';
import DataProvider from './components/DataProvider';
import Layout from './components/Layout';
import { HashRouter, Switch, Route } from 'react-router-dom';
import BlockList from './components/BlockList';

export default function App() {

  return (
    <DataProvider>
      <HashRouter>
        <Layout>
            <Switch>
              <Route path="/chain-explorer">
                <BlockList />
              </Route>
            </Switch>
        </Layout>
      </HashRouter>
    </DataProvider>
  )
}