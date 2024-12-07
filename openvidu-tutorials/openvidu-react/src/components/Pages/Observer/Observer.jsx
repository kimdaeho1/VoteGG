// Observer.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './Observer.css';
import TestChat from '../../Elements/TestChat/TestChat.jsx';
import OpenviduFinal from '../../Elements/openvidu/OpenviduFinal.js';
import useSocket from '../../useSocket';
import RoomControl from '../../Elements/RoomControl/RoomControl.jsx';

const Observer = () => {
  const { roomNumber } = useParams();
  const socket = useSocket("/timer", roomNumber);
  const [isOpenviduActive, setIsOpenviduActive] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('openviduActive', (isActive) => {
        setIsOpenviduActive(isActive);
      });
    }
  }, [socket]);

  return (
    <div className="room">
      <div
        className="home-background"
        style={{
          backgroundImage: 'url("/eggbackground.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100vw',
          height: '80vh',
          zIndex: -1,
          minHeight: '790px',
          maxHeight: '790px',
        }}
      ></div>
      <div className='home-background2' />
      <div className='home-background3' />
      <div className="left-side">
        {isOpenviduActive ? (
          <OpenviduFinal
            sessionId={roomNumber}
            userName="Observer"
            isObserver={true}
            subs={false}
          />
        ) : (
          <div className="waiting-message">
            대기 중입니다...
          </div>
        )}
        <div className='emptyspace'>.</div>
        <RoomControl isObserver={true} />
      </div>
      <div className="right-side">
        <TestChat roomId={roomNumber} isObserver={true} />
      </div>
    </div>
  );
};

export default Observer;