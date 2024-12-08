// OpenviduControl.jsx
import React from 'react';
import './OpenviduControl.css'
const OpenviduControl = ({ userId, createdBy, readyUsers, handleStartOpenviduAndTimer }) => {
  return (
    <>
      {userId === createdBy && readyUsers === 2 && (
        <button onClick={handleStartOpenviduAndTimer} className="start-openvidu-button">
          토론 시작하기!
        </button>
      )}
    </>
  );
};

export default OpenviduControl;