import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import CreateRoomButton from '../../Elements/Buttons/CreateRoomButton/CreateRoomButton';
import AlarmButton from '../../Elements/Buttons/AlarmButton/AlarmButton';
import LoginButton from '../../Elements/Buttons/LoginoutButton/LoginoutButton';
import LogoButton from '../../Elements/Buttons/LogoButton/LogoButton';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const roomId = (pathParts[1] === 'room' || pathParts[1] === 'observer')
    ? decodeURIComponent(pathParts[2]) : null;

  const [roomname, setRoomname] = useState('');

  useEffect(() => {
    if (roomId) {
      // 방 정보 가져오기
      fetch(`/api/room/rooms/${roomId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('방 정보를 가져오는 데 실패했습니다.');
          }
          return response.json();
        })
        .then(data => {
          setRoomname(data.roomname);
        })
        .catch(error => {
          console.error('방 정보 가져오기 오류:', error);
        });
    }
  }, [roomId]);

  return (
    <header className="header">
      <div className="header-top">
        <LogoButton />
        {roomId ? (
          <div className="room-id-display">Room: {roomname || roomId}</div>
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
