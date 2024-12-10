// OpenviduControl.jsx
import React from 'react';
import './OpenviduControl.css'
const OpenviduControl = ({ userId, createdBy, readyUsers, handleStartOpenviduAndTimer }) => {
  const handleStart = () => {
    // 토론 시작 시 전체 이벤트 발생
    if (window.session) {
      window.session.signal({
        data: JSON.stringify({ action: 'startRecording' }),
        type: 'startAutoRecording'
      });
    }
    handleStartOpenviduAndTimer();
  };

  return (
    <>
      {userId === createdBy && readyUsers === 2 && (
        <button onClick={handleStart} className="start-openvidu-button">
          토론 시작하기!
        </button>
      )}
    </>
  );
};

export default OpenviduControl;