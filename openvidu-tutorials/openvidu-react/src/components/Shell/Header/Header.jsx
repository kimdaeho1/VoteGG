import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import CreateRoomButton from '../../Elements/Buttons/CreateRoomButton/CreateRoomButton';
import AlarmButton from '../../Elements/Buttons/AlarmButton/AlarmButton';
import LoginButton from '../../Elements/Buttons/LoginoutButton/LoginoutButton';
import './Header.css';

const Header = () => {
  const location = useLocation();

  const pathParts = location.pathname.split('/');
  const roomId = (pathParts[1] === 'room' || pathParts[1] === 'observer')
    ? decodeURIComponent(pathParts[2]) : null;

  return (
    <header className="header">
      <div className="header-top">
        {/* Link 내부에 이미지 추가 */}
        <Link to="/" className="logo-link">
          <img
            src="/mainlogo2.png" // 로고 이미지 경로
            alt="Agora Logo"
            className="logo-image"
          />
        </Link>
        {roomId ? (
          <div className="room-id-display">Room: {roomId}</div>
        ) : (
          <div className="search-container">
            <input type="text" placeholder="Search" className="search-input" />
            <img src="/magnifier.png" alt="Search Icon" className="search-icon" />
          </div>
        )}
        <div className="right">
          <AlarmButton />
          <CreateRoomButton />
          <LoginButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
