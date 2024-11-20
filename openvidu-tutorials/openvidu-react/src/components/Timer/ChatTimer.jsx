import React, { useState } from 'react';

const ChatTimerApp = () => {
  const [isMicOn, setIsMicOn] = useState(false); // 마이크 상태
  const [timeLeft, setTimeLeft] = useState(300); // 제한 시간 (초)

  // 마이크 온/오프 핸들러
  const handleMicToggle = () => {
    if (timeLeft > 0) {
      setIsMicOn((prevMicState) => !prevMicState);
    } else {
      alert("시간이 초과되었습니다. 마이크를 다시 켤 수 없습니다.");
    }
  };

  // 시간이 끝나면 마이크 끄기
  const handleTimeEnd = () => {
    setIsMicOn(false);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>화상 채팅 타이머</h1>
    </div>
  );
};

export default ChatTimerApp;
