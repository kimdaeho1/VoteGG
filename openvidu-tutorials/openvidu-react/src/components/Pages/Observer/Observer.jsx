import React from 'react';
import { useParams } from 'react-router-dom';
import './Observer.css';
import TestChat from '../../Elements/TestChat/TestChat.jsx';
import OpenviduFinal from '../../Elements/openvidu/OpenviduFinal.js';

const Observer = () => {
  const { roomNumber } = useParams(); // URL에서 :id 추출
  const roomId = roomNumber;

  const userId = "example_user_id"; // 실제 로그인된 사용자 ID를 여기에 설정

  return (
    <div className="room">
      <div className="left-side">
        <OpenviduFinal />
        {/* <h1>관전자 페이지입니다</h1> */}
        {/* 관전자 페이지 컨트롤 */}
      </div>
      <div className='right-side'>
        <TestChat roomId={roomId} />
      </div>
    </div>
  );
};

export default Observer;