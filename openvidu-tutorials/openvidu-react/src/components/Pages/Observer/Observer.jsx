import React from 'react';
import { useParams } from 'react-router-dom';
import './Observer.css';
import TestChat from '../../Elements/TestChat/TestChat.jsx';
import OpenviduFinal from '../../Elements/openvidu/OpenviduFinal.js'; // OpenviduFinal 가져오기
import Timer from '../../Elements/openvidu/Timer/Timer';
import RoomControl from '../../Elements/RoomControl/RoomControl.jsx';

const Observer = () => {
  const { roomNumber } = useParams();
  return (
    <div className="room">
      <div className="left-side">
        <OpenviduFinal
          sessionId={roomNumber}
          userName="Observer"
          isObserver={true} // 관전자 모드 활성화
          subs={false}
        />
        <RoomControl isObserver={true}/>
      </div>
      <div className="right-side">
        <TestChat roomId={roomNumber} isObserver={true} /> {/* 옵저버 페이지는 isObserver=true */}
      </div>
    </div>
  );
};

export default Observer;
