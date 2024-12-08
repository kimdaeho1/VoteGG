// Timer.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSocket from "../../../useSocket";
import "./Timer.css";
import VoteStatistic from "../../../Modals/VoteResultModal/VoteStatistic.jsx";
import VoteStatistichard from "../../../Modals/VoteResultModal/VoteStatistichard.jsx";
import { useRecoilState } from 'recoil';
import { resetTimerState } from '../../../../stores/TimerAtom';
import { registerSetResetTimerFunc } from '../../../../stores/setTimerState';

const Timer = ({ isObserver }) => {
  const { roomNumber } = useParams();
  const roomId = roomNumber;
  const socket = useSocket("/timer", roomId);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [totalCycles, setTotalCycles] = useState(4);
  const [timerFinished, setTimerFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [resetTimer, setResetTimer] = useRecoilState(resetTimerState);
  const [showVoteStatistic, setShowVoteStatistic] = useState(false);
  const [stopRequests, setStopRequests] = useState(0); // 종료 요청 상태 관리
  const [isStopRequested, setIsStopRequested] = useState(false); // 사용자 버튼 상태 관리
  const [isOpenviduActive, setIsOpenviduActive] = useState(false);

  useEffect(() => {
    registerSetResetTimerFunc(setResetTimer);
  }, [setResetTimer]);

  useEffect(() => {
    if (resetTimer) {
      handleReset();
      setResetTimer(false);
    }
  }, [resetTimer]);

  useEffect(() => {
    if (!socket) return;

    const handleTimerUpdate = (data) => {
      const { timeLeft, isRunning, currentCycle, totalCycles, currentIndex } = data;
      setTimeLeft(timeLeft);
      setIsRunning(isRunning);
      setCurrentCycle(currentCycle);
      setTotalCycles(totalCycles);
      setCurrentIndex(currentIndex);
    };

    const handleTimerFinished = (data) => {
      setIsRunning(false);
      setTimerFinished(true);
      setResultData(data || {});

      const maxViewers = localStorage.getItem("maxViewers");
      if (maxViewers) {
        socket.emit("updateMaxViewers", {
          roomId: roomNumber,
          maxViewers: parseInt(maxViewers, 10),
        });
        localStorage.removeItem("maxViewers");
      }
    };

    socket.on('openviduActive', (isActive) => {
      setIsOpenviduActive(isActive);
    });

    const handlePhaseChange = (data) => {
      const { newPhase, newTurn } = data;
      if (window.handlePhaseChange) {
        window.handlePhaseChange(newPhase, newTurn);
      }
    };

    const handleStopRequestUpdate = (data) => {
      setStopRequests(data.stopRequests);
    };

    socket.on('timerUpdate', handleTimerUpdate);
    socket.on('timerFinished', handleTimerFinished);
    socket.on('phaseChange', handlePhaseChange);
    socket.on('stopRequestUpdate', handleStopRequestUpdate);

    return () => {
      socket.off('timerUpdate', handleTimerUpdate);
      socket.off('timerFinished', handleTimerFinished);
      socket.off('phaseChange', handlePhaseChange);
      socket.off('stopRequestUpdate', handleStopRequestUpdate);
    };
  }, [socket]);

  const handleStart = () => {
    if (socket) {
      socket.emit('start_timer', roomId);
      setTimerFinished(false);
    }
  };

  const handleReset = () => {
    if (socket) {
      socket.emit('reset_timer', roomId);
      setTimerFinished(false);
    }
  };

  const handleStopToggle = () => {
    if (socket) {
      const newStatus = !isStopRequested;
      setIsStopRequested(newStatus);
      socket.emit('toggle_stop_request', { roomId, requested: newStatus });
    }
  };

  useEffect(() => {
    if (stopRequests >= 2) {
      if (socket) {
        socket.emit('stop_timer', roomId);
        setIsRunning(false);
        setTimeLeft(0);
      }
    }
  }, [stopRequests, socket]);

  if (timeLeft === null) {
    return <div>로딩 중...</div>;
  }

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`.trim();
  };

  const getIndexCharacter = (index) => {
    const indexMapping = ["발언 중", "발언 중", "ㄷ", "ㄹ"];
    return indexMapping[index] || "알 수 없음";
  };

  const getStatusClass = (index) => {
    switch (index) {
      case 0:
        return "status-preparing";
      case 1:
        return "status-speaking";
      case 2:
        return "status-third";
      case 3:
        return "status-fourth";
      default:
        return "status-unknown";
    }
  };

  return (
    <div>
      <div className="timer-wrapper">
        <div className="timer-container">
          <div className="status-and-button">
            {/* <span className={`current-status ${getStatusClass(currentIndex)}`}>
              {!isRunning && !timerFinished
                ? "토론 준비"
                : timerFinished
                  ? "토론 끝"
                  : getIndexCharacter(currentIndex)}
            </span> */}
            {!isObserver && isOpenviduActive && (
              <div>
                {/* <div>{}</div> */}
                <button
                  className="stop-button"
                  onClick={handleStopToggle}
                >
                  {isStopRequested ? "종료 취소" : "토론 종료"}
                </button>
              </div>
            )}
          </div>
          <div className="timer-text">
            <span>{formatTime(timeLeft).split(":")[0]}</span>
            <span>:</span>
            <span>{formatTime(timeLeft).split(":")[1]}</span>
          </div>
        </div>
      </div>

      {timerFinished && <VoteStatistic roomNumber={roomId} resultData={resultData} onClose={() => setTimerFinished(false)} />}

      {/* <div>
        <button onClick={() => setShowVoteStatistic(true)}>하드 코딩된결과 보기</button>
        {showVoteStatistic && <VoteStatistichard onClose={() => setShowVoteStatistic(false)} />}
      </div> */}
    </div>
  );
};

export default Timer;
