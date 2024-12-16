// ReadyButton.jsx
import React from 'react';
import './ReadyButton.css'

const ReadyButton = ({ isReady, handleToggleReady }) => {
  return (
    <div className="ready-button">
      <button onClick={handleToggleReady} className="toggle-ready-button">
        {isReady ? "취소하기" : "Ready!"}
      </button>
    </div>
  );
};

export default ReadyButton;