// Timer.jsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSocket from "../../../useSocket";
import "./Timer.css";
import VoteStatistic from "../../../Modals/VoteResultModal/VoteStatistic.jsx";

import { useRecoilState } from 'recoil';
import { resetTimerState } from '../../../../stores/TimerAtom'; // 수정된 경로
import { registerSetResetTimerFunc } from '../../../../stores/setTimerState'; // 수정된 경로

const Timer = () => {
  const { roomNumber } = useParams();
  const roomId = roomNumber;
  const socket = useSocket("/timer", roomId);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [totalCycles, setTotalCycles] = useState(4);
  const [timerFinished, setTimerFinished] = useState(false);

  const [resetTimer, setResetTimer] = useRecoilState(resetTimerState);

  // setResetTimer 함수를 헬퍼 함수에 등록
  useEffect(() => {
    registerSetResetTimerFunc(setResetTimer);
  }, [setResetTimer]);

  // resetTimer 상태 변경 감지
  useEffect(() => {
    if (resetTimer) {
      handleReset();
      setResetTimer(false);
    }
  }, [resetTimer]);

  useEffect(() => {
    if (!socket) return;

    // 타이머 업데이트 받기
    const handleTimerUpdate = (data) => {
      const { timeLeft, isRunning, currentCycle, totalCycles } = data;
      console.log("타이머 업데이트:", data);
      setTimeLeft(timeLeft);
      setIsRunning(isRunning);
      setCurrentCycle(currentCycle);
      setTotalCycles(totalCycles);
    };

    // 타이머 종료 이벤트 받기
    const handleTimerFinished = () => {
      console.log("타이머가 완료되었습니다.");
      setIsRunning(false);
      setTimerFinished(true);
    };

    socket.on('timerUpdate', handleTimerUpdate);
    socket.on('timerFinished', handleTimerFinished);

    // 클린업
    return () => {
      socket.off('timerUpdate', handleTimerUpdate);
      socket.off('timerFinished', handleTimerFinished);
    };
  }, [socket]);

  // 타이머 시작 버튼 클릭 핸들러
  const handleStart = () => {
    if (socket) {
      socket.emit('start_timer', roomId);
      setTimerFinished(false);
    }
  };

  // 타이머 초기화 버튼 클릭 핸들러
  const handleReset = () => {
    if (socket) {
      socket.emit('reset_timer', roomId);
      setTimerFinished(false);
    }
  };

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
      .padStart(2, "0")}`.trim();
  };
  

  return (
    <div>
      <div className="timer-container">
        <div className="timer-text">
          <span>{formatTime(timeLeft).split(":")[0]}</span> {/* 분 */}
          {/* <span>:</span> */}
          <span>{formatTime(timeLeft).split(":")[1]}</span> {/* 초 */}
        </div>
      </div>
      <p>현재 사이클: {currentCycle} / {totalCycles}</p>
      {timerFinished && <p>타이머가 완료되었습니다.</p>}

      <button onClick={handleStart} disabled={isRunning || timeLeft <= 0 || currentCycle >= totalCycles}>
        타이머 시작
      </button>
      <button onClick={handleReset}>
        타이머 초기화
      </button>

      {/* 타이머가 끝나면 모달을 띄움 */}
      {timerFinished && <VoteStatistic roomNumber={roomId} onClose={() => setTimerFinished(false)} />}
    </div>
  );
};

export default Timer;