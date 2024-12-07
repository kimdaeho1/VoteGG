// ReadyButton.jsx
import React from 'react';
import './ReadyButton.css'

const ReadyButton = ({ isReady, handleToggleReady }) => {
  return (
    <div className="ready-button">
      <button onClick={handleToggleReady} className="toggle-ready-button">
        {isReady ? "Cancel Ready" : "Ready"}
      </button>
    </div>
  );
};

export default ReadyButton;