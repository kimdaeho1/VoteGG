// TimerButtons.jsx
import React from 'react';
import './TimerButtons.css'

const TimerButtons = ({ handleSetTimerDuration }) => {
  return (
    <div className="timer-buttons">
      <button onClick={() => handleSetTimerDuration(1 * 60)}>5분</button>
      <button onClick={() => handleSetTimerDuration(10 * 60)}>10분</button>
      <button onClick={() => handleSetTimerDuration(15 * 60)}>15분</button>
      <button onClick={() => handleSetTimerDuration(99 * 60)}>30분</button>
    </div>
  );
};

export default TimerButtons;