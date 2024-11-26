// Timer.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSocket from "../../../useSocket"; // 커스텀 훅 가져오기
import "./Timer.css";

const Timer = () => {
  const { roomNumber } = useParams(); // URL의 :id 부분 추출
  const roomId = roomNumber;
  const socket = useSocket("/timer", roomId); // 소켓 연결 가져오기 (네임스페이스 수정)
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!socket) return;

    // 타이머 업데이트 받기
    const handleTimerUpdate = (newTimeLeft) => {
      console.log("타이머 업데이트:", newTimeLeft);
      setTimeLeft(newTimeLeft);
    };

    socket.on('timerUpdate', handleTimerUpdate);

    // 클린업
    return () => {
      socket.off('timerUpdate', handleTimerUpdate);
    };
  }, [socket]);

  // 로딩 상태 처리
  if (timeLeft === null) {
    return <div>로딩 중...</div>;
  }

  // 시간을 "분:초" 형식으로 변환하는 함수
  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="timer-container">
      <div className="timer-text">
        <span>{formatTime(timeLeft).split(" : ")[0]}</span> {/* 분 */}
        <span>{formatTime(timeLeft).split(" : ")[1]}</span> {/* 초 */}
      </div>
    </div>
  );
};

export default Timer;
