import React from 'react';
import { useParams } from 'react-router-dom';
import VideoGrid from '../../VideoGrid/VideoGrid.jsx';
import Avatar from '../../Avatar/Avatar.jsx';
import './Room.css';
import TestChat from '../../TestChat/TestChat.jsx';
import RoomControl from '../../RoomControl/RoomControl.jsx';

const Room = ({ role }) => {
  const { roomNumber } = useParams(); // URL에서 :id 추출
  const roomId = roomNumber;

  const userId = "example_user_id"; // 실제 로그인된 사용자 ID를 여기에 설정

  return (
    <div className="room">
      <div className="left-side">
        <VideoGrid />
        <RoomControl />
      </div>
      <div className='right-side'>
        <TestChat roomId={roomId} />
      </div>
    </div>
  );
};

export default Room;
