import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Pages/Home/Home.jsx';
import Room from './components/Pages/Room/Room.jsx';
import Login from './components/Pages/Login/Login.jsx';
import Observer from './components/Pages/Observer/Observer.jsx';
import Signup from './components/Pages/Signup/Signup.jsx';
import Header from './components/Shell/Header/Header.jsx';
import LeftSidebar from './components/Shell/LeftSidebar/LeftSidebar.jsx';
import './Layers.css';
import DebateRoom from './components/Pages/DebateRoom/DebateRoom.jsx';
import SetUsername from './components/Pages/Login/SetUsername.jsx'; // 소셜로그인중 처음 로그인할 때 아이디 설정 페이지 라우팅용
import ScrollToTop from './components/ScrollToTop.js';

const Layers = () => {
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
              path="/DebateRoom/:roomNumber"
              element={<DebateRoom role="participant" />}
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
