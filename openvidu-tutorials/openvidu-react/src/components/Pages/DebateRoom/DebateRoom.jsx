import React from 'react';
import { useParams } from 'react-router-dom';
import './DebateRoom.css';
import TestChat from '../../Elements/TestChat/TestChat.jsx';
import RoomControl from '../../Elements/RoomControl/RoomControl.jsx';
import OpenviduFinal from '../../Elements/openvidu/OpenviduFinal.js';
import jwtDecode from 'jwt-decode'; // jwt-decode 라이브러리 임포트

const DebateRoom = () => {
  const { roomNumber } = useParams();

  // 토큰에서 사용자 이름 추출
  const token = localStorage.getItem("token");
  const userId = token ? getUsernameFromToken(token) : "Unknown User";

  return (
    <div className="room">
      <div className="left-side">
        <OpenviduFinal sessionId={roomNumber} userName={userId} />
        <RoomControl />
      </div>
      <div className="right-side">
        <TestChat roomId={roomNumber} isObserver={false} /> {/* 참가자 페이지는 isObserver=false */}
      </div>
    </div>
  );
};

export default DebateRoom;

// Utility Function for Token Decoding
const getUsernameFromToken = (token) => {
  try {
    const decoded = jwtDecode(token); // JWT 디코딩
    return decoded.username || 'Unknown User'; // username 반환, 없을 시 기본값
  } catch (error) {
    console.error('Failed to decode token:', error);
    return 'Unknown User';
  }
};
