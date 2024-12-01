import React from 'react';
import Layers from './Layers.js';
import { RecoilRoot } from 'recoil';
import { SearchProvider } from './stores/SearchContext'; // SearchProvider 추가



function App() {
  return (
    <RecoilRoot>
      <SearchProvider>
        <Layers />
      </SearchProvider>
    </RecoilRoot>
  );
}

export default App;