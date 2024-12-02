// RoomControl.jsx
import React, { useEffect, useState } from 'react';
import './RoomControl.css';
// import EndButton from '../Buttons/EndButton/EndButton';
import Timer from '../openvidu/Timer/Timer';
import { useParams, useLocation } from 'react-router-dom';
import RoomInfo from '../Buttons/EndButton/RoomInfo';

const RoomControl = ({ isObserver }) => {
  const location = useLocation();
  const { roomNumber } = useParams(); // URL의 :id 부분 추출
  const [roomname, setRoomname] = useState('');

  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const roomId = (pathParts[1] === 'room' || pathParts[1] === 'observer')
      ? decodeURIComponent(pathParts[2])
      : null;

    if (roomId) {
      fetch(`/api/room/rooms/${roomId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('방 정보를 가져오는 데 실패했습니다.');
          }
          return response.json();
        })
        .then(data => {
          setRoomname(data.roomname || roomId);
        })
        .catch(error => {
          console.error('방 정보 가져오기 오류:', error);
        });
    }
  }, [location.pathname]);

  return (

    <div className='control-wrap'>
      <h1 className="room-title">{roomname || "untitled"}</h1>
      <div className="roomcontrol">
        <div className='aa'>
          <RoomInfo />
        </div>
        <div className='bb'>
          <Timer roomId={roomNumber} isObserver={isObserver} />
        </div>
      </div>
    </div>
  );
};

export default RoomControl;
