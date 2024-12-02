import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import CreateRoomButton from '../../Elements/Buttons/CreateRoomButton/CreateRoomButton';
import AlarmButton from '../../Elements/Buttons/AlarmButton/AlarmButton';
import InviteButton from '../../Elements/Buttons/InviteButton/InviteButton';
import LoginButton from '../../Elements/Buttons/LoginoutButton/LoginoutButton';
import LogoButton from '../../Elements/Buttons/LogoButton/LogoButton';
import Search from './Search/Search.jsx'; // Search.jsx import
import './Header.css';

const Header = () => {
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const roomId = (pathParts[1] === 'room' || pathParts[1] === 'observer')
    ? decodeURIComponent(pathParts[2]) : null;

  const [roomname, setRoomname] = useState('');

  useEffect(() => {
    if (roomId) {
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
        {/* {roomId ? (
          <div className="room-id-display">Room: {roomname || roomId}</div>
        ) : (
          <Search /> // Search 컴포넌트 사용
        )} */}
        <Search />
        <div className="right">
          {pathParts[1] === 'room' && <InviteButton />}
          <AlarmButton />
          <CreateRoomButton />
          <LoginButton />
        </div>
      </div>
    </header>
  );
};

export default Header;