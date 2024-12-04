import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Pages/Home/Home.jsx';
import Room from './components/Pages/Room/Room.jsx';
import Login from './components/Pages/Login/Login.jsx';
import Observer from './components/Pages/Observer/Observer.jsx';
import Signup from './components/Pages/Signup/Signup.jsx';
import Header from './components/Shell/Header/Header.jsx';
import LeftSidebar from './components/Shell/LeftSidebar/LeftSidebar.jsx';
import './Layers.css';
import SetUsername from './components/Pages/Login/SetUsername.jsx'; // 소셜로그인중 처음 로그인할 때 아이디 설정 페이지 라우팅용
import ScrollToTop from './components/ScrollToTop.js';

const MobileFallback = () => (
  <div className="mobile-fallback">
    <img
      src="/logos.png" // 로고 이미지 경로
      alt="Logo"
      className="mobile-logo"
    />
    <img
      src="/poultry.png" // 로고 이미지 경로
      alt="Logo2"
      className="mobile-logo2"
    />
    <h1 className="mobile-title">모바일은 지원되지 않습니다</h1>
    <p className="mobile-text">데스크톱 환경에서 접속해주세요.</p>
    <img
      src="/eggback2.jpg" 
      alt="Background"
      className="mobile-background"
    />
  </div>
);

const Layers = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileScreen = window.matchMedia('(max-width: 768px)').matches;
      setIsMobile(isMobileScreen);
    };

    checkMobile(); // 초기 체크
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  if (isMobile) {
    return <MobileFallback />;
  }

  return (
    <div className="layers">
      <Header />
      <div className="main-layout">
        <LeftSidebar />
        <div className="content">
          <Routes>
            {/* 메인 페이지 라우트 */}
            <Route path="/" element={<Home />} />

            {/* 아이디 설정 페이지 라우트 */}
            <Route path="/set-username" element={<SetUsername />} />

            {/* 참여자와 관전자 라우트 */}
            <Route
              path="/room/:roomNumber"
              element={<Room role="participant" />}
            />

            <Route
              path="/observer/:roomNumber"
              element={<Observer role="observer" />}
            />

            {/* 로그인 및 회원가입 페이지 라우트 */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
          <ScrollToTop />
        </div>
      </div>
    </div>
  );
};

export default Layers;
