import React from 'react';
import Layers from './Layers.js';
import { RecoilRoot } from 'recoil';
import { SearchProvider } from './stores/SearchContext'; // SearchProvider 추가
import { ToastProvider } from './components/Elements/Toast/ToastContext.jsx'; // ToastProvider 추가



function App() {
  return (
    <RecoilRoot>
      <SearchProvider>
        <ToastProvider>
          <Layers />
        </ToastProvider>
      </SearchProvider>
    </RecoilRoot>
  );
}

export default App;