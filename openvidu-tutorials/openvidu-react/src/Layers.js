import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Pages/Home/Home.jsx';
import Room from './components/Pages/Room/Room.jsx';
import Login from './components/Pages/Login/Login.jsx';
import Observer from './components/Observer/Observer.jsx';
import Signup from './components/Pages/Signup/Signup.jsx';
import Header from './components/Header/Header.jsx';
import LeftSidebar from './components/LeftSidebar/LeftSidebar.jsx';
import './Layers.css';

const Layers = () => {
  return (
    <Router>
      <div className="layers">
        <Header />
        <div className="main-layout">
          <LeftSidebar />
          <div className="content">
            <Routes>
              {/* 메인 페이지 라우트 */}
              <Route path="/" element={<Home />} />

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
          </div>
        </div>
      </div>
    </Router>
  );
};

export default Layers;
