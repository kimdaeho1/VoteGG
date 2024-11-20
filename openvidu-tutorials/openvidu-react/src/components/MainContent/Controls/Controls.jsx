import React, { useState } from 'react';
import './Controls.css';

const Controls = () => {
  const [time, setTime] = useState(0); // 타이머 시간 관리

  const handleStart = () => {
    // 타이머 시작 로직
  };

  const handleNext = () => {
    // 다음 작업 로직
  };

  const handleStop = () => {
    // 타이머 정지 로직
  };

  const handleExit = () => {
    // 종료 로직
  };

  return (
    <div className="timer-controls">
      <div className="time-display">{time} 초</div>
      <div className="button-group">
        <button onClick={handleStart} className="control-button">
          Start
        </button>
        <button onClick={handleNext} className="control-button">
          Next
        </button>
        <button onClick={handleStop} className="control-button">
          Stop
        </button>
        <button onClick={handleExit} className="control-button">
          Exit
        </button>
      </div>
    </div>
  );
};

export default Controls;
