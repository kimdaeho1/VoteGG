
// import React, { useEffect, useState } from 'react';
// import { useParams, useLocation } from 'react-router-dom';
// import './Room.css';
// import TestChat from '../../Elements/TestChat/TestChat.jsx';
// import RoomControl from '../../Elements/RoomControl/RoomControl.jsx';
// import OpenviduFinal from '../../Elements/openvidu/OpenviduFinal.js';
// import useSocket from "../../useSocket";

// const Room = () => {
//   const { roomNumber } = useParams();
//   const location = useLocation();
//   const socket = useSocket("/timer", roomNumber);

//   // 토큰에서 사용자 이름 추출
//   const token = localStorage.getItem("token");
//   const userId = token ? getUsernameFromToken(token) : "Unknown User";

//   // 방 상태 관리
//   const [roomname, setRoomname] = useState('');
//   const [isOpenviduActive, setIsOpenviduActive] = useState(false); // Openvidu 실행 여부 관리
//   const [timerMinutes, setTimerMinutes] = useState(0); // 타이머 분 상태 관리
//   const [timerSeconds, setTimerSeconds] = useState(0); // 타이머 초 상태 관리
//   const [createdBy, setCreatedBy] = useState(''); // 방 생성자 ID
//   const [timerDuration, setTimerDuration1] = useState(0); // 타이머 지속 시간
//   const [isReady, setIsReady] = useState(false); // 현재 사용자의 준비 상태
//   const [readyUsers, setReadyUsers] = useState(0); // 준비된 사용자 수

//   useEffect(() => {
//     const pathParts = location.pathname.split('/');
//     const roomId = (pathParts[1] === 'room' || pathParts[1] === 'observer')
//       ? decodeURIComponent(pathParts[2])
//       : null;

//     if (roomId) {
//       fetch(`/api/room/rooms/${roomId}`)
//         .then(response => {
//           if (!response.ok) {
//             throw new Error('방 정보를 가져오는 데 실패했습니다.');
//           }
//           return response.json();
//         })
//         .then(data => {
//           setRoomname(data.roomname || roomId);
//           setCreatedBy(data.createdby);
//         })
//         .catch(error => {
//           console.error('방 정보 가져오기 오류:', error);
//         });
//     }
//   }, [location.pathname]);

//   useEffect(() => {
//     if (socket) {
//       // 서버에서 준비 상태 업데이트 받기
//       socket.on('update_ready_count', (readyCount) => {
//         setReadyUsers(readyCount);
//       });

//       socket.on('openviduActive', (isActive) => {
//         setIsOpenviduActive(isActive);
//       });
//     }
//   }, [socket]);

//   // OpenviduFinal 활성화
//   const handleStartOpenvidu = () => {
//     setIsOpenviduActive(true);
//   };

//   // 준비 버튼 핸들러
//   const handleToggleReady = () => {
//     if (socket) {
//       const newReadyState = !isReady;
//       setIsReady(newReadyState);
//       socket.emit('toggle_ready', { roomId: roomNumber, userId, isReady: newReadyState });
//     }
//   };

//   const handleSetTimerDuration = (duration) => {
//     if (socket) {
//       // 서버에 `durations` 배열로 전달
//       socket.emit('set_timer_duration', {roomId:roomNumber, duration:[duration] });
//       // setTimerDuration1(duration);
//     } else {
//       console.error("Socket is not connected.");
//     }
//   };

//   const handleStartTimer = () => {
//     if (socket) {
//       socket.emit('start_timer', roomNumber); // 서버가 요구하는 `roomId`만 전달
//       setTimerFinished(false); // 타이머 완료 상태 초기화
//     } else {
//       console.error("Socket is not connected.");
//     }
//   };


//   // OpenviduFinal과 타이머 시작
//   const handleStartOpenviduAndTimer = async () => {
//     try {
//       handleStartOpenvidu();
//       handleStartTimer(); 
//     } catch (error) {
//       console.error('Error in handleStartOpenviduAndTimer:', error);
//     }
//   };

//   return (
//     <div className="room">
//       <div
//         className="home-background"
//         style={{
//           backgroundImage: 'url("/eggbackground.jpg")',
//           backgroundSize: 'cover',
//           backgroundPosition: 'center',
//           backgroundRepeat: 'no-repeat',
//           position: 'fixed',
//           top: 0,
//           right: 0,
//           width: '100vw',
//           height: '80vh',
//           zIndex: -1,
//           minHeight: '790px',
//           maxHeight: '790px',
//         }}
//       ></div>
//       <div className='home-background2' />
//       <div className='home-background3' />
//       <div className="left-side">
//         {/* Openvidu 활성화 상태에 따라 UI 변경 */}
//         {isOpenviduActive ? (
//           <OpenviduFinal sessionId={roomNumber} userName={userId} />
//         ) : (
//           <>
//             {/* Start Openvidu Session 버튼 */}
//             {userId === createdBy && readyUsers === 2 && (
//               <button onClick={handleStartOpenviduAndTimer} className="start-openvidu-button">
//                 Start Openvidu Session
//               </button>
//             )}
//             {userId === createdBy &&(
//             <div className="timer-buttons">
//               <button onClick={() => handleSetTimerDuration(3)}>5분</button>
//               <button onClick={() => handleSetTimerDuration(10 * 60)}>10분</button>
//               <button onClick={() => handleSetTimerDuration(15 * 60)}>15분</button>
//               <button onClick={() => handleSetTimerDuration(30 * 60)}>30분</button>
//             </div>
//             )}
//             <div className="ready-button">
//               <button onClick={handleToggleReady} className="toggle-ready-button">
//                 {isReady ? "Cancel Ready" : "Ready"}
//               </button>
//             </div>
//             <div className="ready-status">
//               레디 새로고침시 고장남: {readyUsers}/2
//             </div>
//           </>
//         )}
//       </div>
//       <RoomControl setTimerDuration={timerDuration} />
//       <div className="right-side">
//         <TestChat roomId={roomNumber} isObserver={false} />
//       </div>
//     </div>
//   );
// };

// export default Room;

// const getUsernameFromToken = (token) => {
//   try {
//     const payload = JSON.parse(atob(token.split('.')[1])); // JWT payload parsing
//     return payload.username; // Extract username
//   } catch (error) {
//     console.error('Failed to parse token:', error);
//     return 'Unknown User';
//   }
// };

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

const Room = () => {
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
      handleStartOpenvidu();
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
        {isOpenviduActive ? (
          <OpenviduFinal sessionId={roomNumber} userName={userId} />
        ) : (
          <>
            <OpenviduControl
              userId={userId}
              createdBy={createdBy}
              readyUsers={readyUsers}
              handleStartOpenviduAndTimer={handleStartOpenviduAndTimer}
            />
            {userId === createdBy && (
              <TimerButtons handleSetTimerDuration={handleSetTimerDuration} />
            )}
            <ReadyButton
              isReady={isReady}
              handleToggleReady={handleToggleReady}
            />
            <ReadyStatus readyUsers={readyUsers} />
          </>
        )}
      </div>
      <RoomControl />
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