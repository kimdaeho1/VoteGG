// routes/timer.js

const express = require('express');
const router = express.Router();
const rooms = {}; // 방별 타이머 정보를 저장할 객체
const User = require("../schemas/user");
const Room = require("../schemas/room");
const DebateResult = require("../schemas/debateResult");

function timerSocketHandler(io) {
  // Namespace 혹은 Path 설정
  const timerNamespace = io.of('/timer');

  timerNamespace.on('connection', (socket) => {
    // 방에 조인하는 이벤트 처리
    socket.on('join_room', (roomId) => {
      socket.join(roomId);

      // 해당 방의 타이머가 없으면 생성
      if (!rooms[roomId]) {
        rooms[roomId] = {
          durations: [300], // 타이머 단계들의 지속 시간 (초)
          cycleCount: 1, // 총 사이클 수
          currentCycle: 0, // 현재 사이클
          currentIndex: 0, // 현재 단계 인덱스
          timeLeft: 300, // 초기 남은 시간
          isRunning: false,
          timer: null, // 타이머 객체
          currentPhase: 1, // 초기 phase
          currentTurn: 'left', // 초기 turn
          readyCount: 0, // 준비된 사용자 수
          stopRequests: 0, // 종료 요청 상태
          currentMemberCount: 0, // 현재 멤버 수
          maxMemberCount: 0, // 최대 멤버 수
        };
      }

      const room = rooms[roomId];

      // 멤버 수 증가
      room.currentMemberCount++;
      if (room.currentMemberCount > room.maxMemberCount) {
        room.maxMemberCount = room.currentMemberCount;
      }

      // 현재 타이머 상태를 클라이언트에게 전송
      socket.emit('timerUpdate', {
        timeLeft: room.timeLeft,
        isRunning: room.isRunning,
        currentIndex: room.currentIndex,
        currentCycle: room.currentCycle,
        totalCycles: room.cycleCount,
        currentPhase: room.currentPhase,
        currentTurn: room.currentTurn,
      });
    });

    socket.on('toggle_ready', ({ roomId, isReady }) => {
      const room = rooms[roomId];
      if (!room) return;
    
      // 준비 상태 업데이트
      room.readyCount += isReady ? 1 : -1;
      room.readyCount = Math.max(0, room.readyCount); // 음수 방지
    
      // 모든 클라이언트에게 준비 상태 업데이트 전송
      timerNamespace.to(roomId).emit('update_ready_count', room.readyCount);
    });

    socket.on('toggle_stop_request', ({ roomId, requested }) => {
      const room = rooms[roomId];
      if (!room) return;

      // 종료 요청 수 업데이트
      room.stopRequests += requested ? 1 : -1;
      room.stopRequests = Math.max(0, room.stopRequests);

      // 모든 클라이언트에게 종료 요청 수 업데이트
      timerNamespace.to(roomId).emit('stopRequestUpdate', {
        stopRequests: room.stopRequests,
      });

      // 종료 요청이 2명 이상인 경우 타이머 종료
      if (room.stopRequests >= 2 && room.isRunning) {
        stopTimer(roomId);
        timerNamespace.to(roomId).emit('timerFinished', {
          timeLeft: 0,
          isRunning: false,
          currentIndex: room.currentIndex,
          currentCycle: room.currentCycle,
          totalCycles: room.cycleCount,
          currentPhase: room.currentPhase,
          currentTurn: room.currentTurn,
        });
      }
    });

    // 타이머 시작 이벤트 처리
    socket.on('start_timer', (roomId) => {
      const room = rooms[roomId];
      if (room && !room.isRunning && room.currentCycle < room.cycleCount) {
        startTimer(roomId);
        // 모든 클라이언트에게 Openvidu 활성화 알림
        timerNamespace.to(roomId).emit('openviduActive', true);
      }
    });

    // 타이머 초기화 이벤트 처리 -> 사이클 넘김으로 변경
    socket.on('reset_timer', (roomId) => {
      const room = rooms[roomId];
      if (room) {
        skipToNextCycle(roomId);
      }
    });

    // 타이머 종료 이벤트 처리
    socket.on('stop_timer', (roomId) => {
      const room = rooms[roomId];
      if (room) {
        room.timeLeft = 0; // 강제로 시간을 0초로
        stopTimer(roomId);
        timerNamespace.to(roomId).emit('timerFinished', {
          timeLeft: 0,
          isRunning: false,
          currentIndex: room.currentIndex,
          currentCycle: room.currentCycle,
          totalCycles: room.cycleCount,
          currentPhase: room.currentPhase,
          currentTurn: room.currentTurn,
        });
    
        // 모든 사이클 완료 처리
        room.currentCycle = room.cycleCount;
    
        // 투표 결과 처리 여부 체크
        if (!room.isVotingHandled) {
          room.isVotingHandled = true;
          handleVotingAndResults(roomId);
        }
      }
    });

    // 타이머 시간 설정 이벤트 처리
    socket.on('set_timer_duration', ({ roomId, duration }) => {
      const room = rooms[roomId];
      if (room) {
        room.durations[0] = duration; 
        room.timeLeft = duration;
    
        // 모든 클라이언트에게 업데이트된 타이머 정보 전송
        timerNamespace.to(roomId).emit('timerUpdate', {
          timeLeft: room.timeLeft,
          isRunning: room.isRunning,
          currentIndex: room.currentIndex,
          currentCycle: room.currentCycle,
          totalCycles: room.cycleCount,
        });
      }
    });

    // 클라이언트 연결 해제 시 처리
    socket.on('disconnect', () => {
      const roomsJoined = socket.rooms;
      roomsJoined.forEach((roomId) => {
        if (roomId === socket.id) return; // 기본 방(ID)이 소켓 ID인 경우 스킵

        const room = rooms[roomId];
        if (room) {
          // 멤버 수 감소
          room.currentMemberCount = Math.max(0, room.currentMemberCount - 1);

          // 방의 사용자 수 확인
          const numUsers = timerNamespace.adapter.rooms.get(roomId) ? timerNamespace.adapter.rooms.get(roomId).size : 0;
          if (numUsers === 0) {
            // 방에 사용자가 없으므로 타이머 정리
            stopTimer(roomId);
            delete rooms[roomId];
          }
        }
      });
    });
  });

  // 타이머 시작 함수
  function startTimer(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.isRunning = true;
    const currentDuration = room.durations[room.currentIndex];
    room.timeLeft = currentDuration;
    const endTime = Date.now() + room.timeLeft * 1000;

    room.timer = setInterval(() => {
      const remainingTime = Math.round((endTime - Date.now()) / 1000);
      room.timeLeft = Math.max(remainingTime, 0);

      // 타이머 업데이트 전송
      timerNamespace.to(roomId).emit('timerUpdate', {
        timeLeft: room.timeLeft,
        isRunning: room.isRunning,
        currentIndex: room.currentIndex,
        currentCycle: room.currentCycle,
        totalCycles: room.cycleCount,
        currentPhase: room.currentPhase,
        currentTurn: room.currentTurn,
      });

      if (room.timeLeft <= 0) {
        clearInterval(room.timer);
        room.timer = null;
        room.isRunning = false;
        moveToNextStage(roomId);
      }
    }, 1000);
  }

  // 다음 단계로 이동하는 함수
  async function moveToNextStage(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.currentIndex++;

    // 모든 단계가 끝나면 사이클 증가 및 초기화
    if (room.currentIndex >= room.durations.length) {
      room.currentIndex = 0;
      room.currentCycle++;

      // 새로운 phase와 turn 설정
      let newPhase = room.currentPhase;
      let newTurn = room.currentTurn;

      if (room.currentTurn === 'left') {
        newTurn = 'right';
      } else {
        // 양측 발언 끝나면 다음 phase 이동 로직 (여기선 phase 변동 없이 예시)
        newTurn = 'left';
        newPhase = room.currentPhase === 1 ? 1 : 1; 
      }

      room.currentPhase = newPhase;
      room.currentTurn = newTurn;

      // phaseChange 이벤트 전송
      timerNamespace.to(roomId).emit('phaseChange', {
        newPhase,
        newTurn,
      });

      // 사이클 완료 확인
      if (room.currentCycle >= room.cycleCount) {
        // 투표 결과 처리
        handleVotingAndResults(roomId);
        return;
      }
    }

    // 다음 단계 자동 시작
    startTimer(roomId);
  }

  // 투표 및 결과 처리 함수
  async function handleVotingAndResults(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    try {
      const roomDocument = await Room.findOne({ roomNumber: roomId });

      if (!roomDocument) {
        console.error(`roomId ${roomId}에 해당하는 방을 찾을 수 없습니다.`);
        return;
      }

      const participantsArray = Array.from(roomDocument.participant.entries());

      if (participantsArray.length < 1) {
        timerNamespace.to(roomId).emit('timerFinished', { error: "참가자가 부족합니다. 최소 4명이 필요합니다." });
        return;
      }

      // 득표 처리 등 기존 로직
      const participantIds = participantsArray.map(([id]) => id);
      const users = await User.find({ username: { $in: participantIds } });

      const historyEntry = {
        roomName: roomDocument.roomname,
        date: new Date(),
      };

      for (const user of users) {
        user.totalParticipations += 1;
        user.myHistory.push(historyEntry);
      }

      const maxVotes = Math.max(...participantsArray.map(([, votes]) => votes));
      const topScorers = users.filter((user) =>
        participantsArray.some(
          ([id, votes]) => id === user.username && votes === maxVotes
        )
      );

      for (const topScorer of topScorers) {
        topScorer.firstPlaceWins += 1;
      }

      await Promise.all(users.map((user) => user.save()));

      // 토론 결과 저장
      const debateResult = new DebateResult({
        roomName: roomDocument.roomname,
        tags: roomDocument.tags,
        maxViewers: room.maxMemberCount, // 여기서 roomDocument.maxViewers 대신 room.maxMemberCount 사용
        participantsArray: Array.from(roomDocument.participant.entries()),
        leftArgument: Array.from(roomDocument.leftUserArgument.entries()),
        rightArgument: Array.from(roomDocument.rightUserArgument.entries()),
      });

      await debateResult.save();

      // 클라이언트에게 결과 전송
      timerNamespace.to(roomId).emit('timerFinished', {
        message: "투표 결과가 성공적으로 처리되었습니다.",
        topScorers: topScorers.map((user) => user.username),
      });

    } catch (error) {
      console.error("투표 결과 처리 중 오류:", error);
      timerNamespace.to(roomId).emit('timerFinished', { error: "투표 결과 처리 중 오류가 발생했습니다." });
    }
  }

  // 타이머 정지 함수
  function stopTimer(roomId) {
    const room = rooms[roomId];
    if (room && room.timer) {
      clearInterval(room.timer);
      room.timer = null;
      room.isRunning = false;
    }
  }

  // 사이클 넘기기 함수
  function skipToNextCycle(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    stopTimer(roomId);

    room.currentCycle++;
    room.currentIndex = 0;

    if (room.currentCycle >= room.cycleCount) {
      timerNamespace.to(roomId).emit('timerFinished');
      return;
    }

    startTimer(roomId);
  }
}

module.exports = { router, timerSocketHandler };
