// Room.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import './Room.css';
import TestChat from '../../Elements/TestChat/TestChat.jsx';
import RoomControl from '../../Elements/RoomControl/RoomControl.jsx';
import OpenviduFinal from '../../Elements/openvidu/OpenviduFinal.js';
import useSocket from "../../useSocket";
import OpenviduControl from '../../Elements/Buttons/Openviducontrol/OpenviduControl';
import TimerButtons from '../../Elements/Buttons/TimerButton/TimerButtons';
import ReadyButton from '../../Elements/Buttons/ReadyButton/ReadyButton';
import ReadyStatus from '../../Elements/Buttons/ReadyStatus/ReadyStatus';
import Timer from '../../Elements/openvidu/Timer/Timer.jsx';
import RoomInfo from '../../Elements/Buttons/EndButton/RoomInfo.jsx';

const Room = ({ isObserver }) => {
  const { roomNumber } = useParams();
  const location = useLocation();
  const socket = useSocket("/timer", roomNumber);

  // 토큰에서 사용자 이름 추출
  const token = localStorage.getItem("token");
  const userId = token ? getUsernameFromToken(token) : "Unknown User";

  // 방 상태 관리
  const [roomname, setRoomname] = useState('');
  const [isOpenviduActive, setIsOpenviduActive] = useState(false);
  const [createdBy, setCreatedBy] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [readyUsers, setReadyUsers] = useState(0);

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
          setCreatedBy(data.createdby);
        })
        .catch(error => {
          console.error('방 정보 가져오기 오류:', error);
        });
    }
  }, [location.pathname]);

  useEffect(() => {
    if (socket) {
      socket.on('update_ready_count', (readyCount) => {
        setReadyUsers(readyCount);
      });

      socket.on('openviduActive', (isActive) => {
        setIsOpenviduActive(isActive);
      });
    }
  }, [socket]);

  const handleStartOpenvidu = () => {
    setIsOpenviduActive(true);
  };

  const handleToggleReady = () => {
    if (socket) {
      const newReadyState = !isReady;
      setIsReady(newReadyState);
      socket.emit('toggle_ready', { roomId: roomNumber, userId, isReady: newReadyState });
    }
  };

  const handleSetTimerDuration = (duration) => {
    if (socket) {
      socket.emit('set_timer_duration', { roomId: roomNumber, duration: [duration] });
    } else {
      console.error("Socket is not connected.");
    }
  };

  const handleStartTimer = () => {
    if (socket) {
      socket.emit('start_timer', roomNumber);
    } else {
      console.error("Socket is not connected.");
    }
  };

  const handleStartOpenviduAndTimer = async () => {
    try {
      handleStartTimer();
    } catch (error) {
      console.error('Error in handleStartOpenviduAndTimer:', error);
    }
  };

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
        <RoomControl />
        {userId === createdBy && !isOpenviduActive && (
          <TimerButtons handleSetTimerDuration={handleSetTimerDuration} />
        )}

        {!isOpenviduActive && (
          <ReadyButton
            isReady={isReady}
            handleToggleReady={handleToggleReady}
          />
        )}

        <OpenviduFinal sessionId={roomNumber} userName={userId} createdBy={createdBy} isstart={isOpenviduActive} />
        {isOpenviduActive ? (
          <div></div>
        ) : (
          <>
            <OpenviduControl
              userId={userId}
              createdBy={createdBy}
              readyUsers={readyUsers}
              handleStartOpenviduAndTimer={handleStartOpenviduAndTimer}
            />
            {/* <ReadyStatus readyUsers={readyUsers} /> */}
          </>
        )}
        <RoomInfo />
      </div>
      <div className="right-side">
        <TestChat roomId={roomNumber} isObserver={false} />
      </div>
    </div>
  );
};

export default Room;

const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username;
  } catch (error) {
    console.error('Failed to parse token:', error);
    return 'Unknown User';
  }
};