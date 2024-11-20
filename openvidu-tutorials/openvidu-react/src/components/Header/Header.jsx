import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CreateRoomButton from '../CreateRoomButton/CreateRoomButton';
import './Header.css';
import AlarmButton from '../AlarmButton/AlarmButton';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const pathParts = location.pathname.split('/');
  const roomId = (pathParts[1] === 'room' || pathParts[1] === 'observer')
    ? decodeURIComponent(pathParts[2]) : null;

  const handleLoginClick = () => {
    navigate('/login');
  };

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
          <button onClick={handleLoginClick} className="login-button">
            Login
          </button>
          {/* <img src="/bell.png" alt="Search Icon" className="bell-icon" /> */}
        </div>
      </div>
    </header>
  );
};

export default Header;
