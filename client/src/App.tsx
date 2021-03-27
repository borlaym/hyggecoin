import React from 'react';
import BlockList from './components/BlockList';
import DataProvider from './components/DataProvider';
import Layout from './components/Layout';

export default function App() {

  return (
    <DataProvider>
      <Layout />
    </DataProvider>
  )
}