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
      <div
        className="home-background"
        style={{
          backgroundImage: 'url("/eggback.jpg")', // 경로 문제 해결된 상태에서 이 방식을 사용
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100vw',
          height: '80vh',
          zIndex: -1,
          minHeight: '800px',
          maxHeight: '800px',
          // opacity: '60%',
        }}
      ></div>
      <div className='home-background2' />
      <div className='home-background3' />
      <div className="left-side">
        <OpenviduFinal
          sessionId={roomNumber}
          userName="Observer"
          isObserver={true} // 관전자 모드 활성화
          subs={false}
        />
        <div className='emptyspace'>.</div>
        <RoomControl isObserver={true} />
      </div>
      <div className="right-side">
        <TestChat roomId={roomNumber} isObserver={true} /> {/* 옵저버 페이지는 isObserver=true */}
      </div>
    </div>
  );
};

export default Observer;
