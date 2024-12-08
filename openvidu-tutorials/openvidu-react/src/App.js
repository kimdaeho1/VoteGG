import React, { useEffect } from 'react';
import Layers from './Layers.js';
import { RecoilRoot } from 'recoil';
import { SearchProvider } from './stores/SearchContext'; // SearchProvider 추가
import { ToastProvider } from './components/Elements/Toast/ToastContext.jsx'; // ToastProvider 추가
import { BrowserRouter } from 'react-router-dom';

function App() {
  useEffect(() => {
    // Kakao SDK 초기화
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init('13ff40fb648001aaef443060fec9946a'); // JavaScript 키 입력
      //console.log('Kakao SDK 초기화 완료');
    } else {
      console.error('Kakao SDK가 로드되지 않았거나 이미 초기화되었습니다.');
    }
  }, []);

  return (
    <BrowserRouter>
      <RecoilRoot>
        <SearchProvider>
          <ToastProvider>
            <Layers />
          </ToastProvider>
        </SearchProvider>
      </RecoilRoot>
    </BrowserRouter>

  );
}

export default App;
