import React from 'react';
import { useParams } from 'react-router-dom';
import './Room.css';
import TestChat from '../../Elements/TestChat/TestChat.jsx';
import RoomControl from '../../Elements/RoomControl/RoomControl.jsx';

const Room = ({ role }) => {
  const { roomNumber } = useParams(); // URL에서 :id 추출
  const roomId = roomNumber;


  return (
    <div className="room">
      <div className="left-side">
        <RoomControl />
      </div>
      <div className='right-side'>
        <TestChat roomId={roomId} />
      </div>
    </div>
  );
};

export default Room;
