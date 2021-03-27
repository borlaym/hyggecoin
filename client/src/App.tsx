import React from 'react';
import BlockList from './components/BlockList';
import DataProvider from './components/DataProvider';

export default function App() {

  return (
    <DataProvider>
      <BlockList />
    </DataProvider>
  )
}