// routes/timer.js

const express = require('express');
const router = express.Router();
const rooms = {}; // 방별 타이머 정보를 저장할 객체

function timerSocketHandler(io) {
  // Namespace 혹은 Path 설정
  const timerNamespace = io.of('/timer');

  timerNamespace.on('connection', (socket) => {
    console.log(`타이머 네임스페이스에 새로운 클라이언트 연결: ${socket.id}`);

    // 방에 조인하는 이벤트 처리
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`타이머방 ${socket.id}가 방 ${roomId}에 참여했습니다.`);

      // 해당 방의 타이머가 없으면 생성
      if (!rooms[roomId]) {
        // 타이머 초기 설정
        rooms[roomId] = {
          durations: [3, 1], // 타이머 단계들의 지속 시간 (초)
          cycleCount: 5, // 총 사이클 수
          currentCycle: 0, // 현재 사이클
          currentIndex: 0, // 현재 단계 인덱스
          timeLeft: 3, // 초기 남은 시간
          isRunning: false,
          timer: null, // 타이머 객체
          currentPhase: 1, // 초기 phase
          currentTurn: 'left', // 초기 turn
        };
      }

      // 현재 타이머 상태를 클라이언트에게 전송
      const room = rooms[roomId];
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

    // 타이머 시작 이벤트 처리
    socket.on('start_timer', (roomId) => {
      const room = rooms[roomId];
      if (room && !room.isRunning && room.currentCycle < room.cycleCount) {
        startTimer(roomId);
      }
    });

    // 타이머 초기화 이벤트 처리 -> 사이클 넘김으로 변경
    socket.on('reset_timer', (roomId) => {
      const room = rooms[roomId];
      if (room) {
        skipToNextCycle(roomId);
      }
    });

    // 클라이언트 연결 해제 시 처리
    socket.on('disconnect', () => {
      console.log('타이머방 연결 해제:', socket.id);

      // 사용자가 속한 방들에 대해 처리
      const roomsJoined = socket.rooms;
      roomsJoined.forEach((roomId) => {
        // 기본 방(ID)이 소켓 ID인 경우 스킵
        if (roomId === socket.id) return;

        // 방에서 나가기
        socket.leave(roomId);

        // 방의 사용자 수 확인
        const room = timerNamespace.adapter.rooms.get(roomId);
        const numUsers = room ? room.size : 0;

        if (numUsers === 0) {
          // 방에 사용자가 없으므로 타이머 정리
          if (rooms[roomId]) {
            stopTimer(roomId);
            delete rooms[roomId];
            console.log(`타이머방 ${roomId}의 타이머가 정리되었습니다.`);
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

      // 방에 있는 모든 클라이언트에게 타이머 업데이트 전송
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

        // 다음 단계로 이동
        moveToNextStage(roomId);
      }
    }, 1000);
  }

  // 다음 단계로 이동하는 함수
  function moveToNextStage(roomId) {
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
        // 양측 참가자들의 발언이 끝나면 다음 phase로 이동
        newTurn = 'left';
        newPhase = room.currentPhase === 1 ? 2 : 1; // Phase를 1과 2 사이에서 변경
      }

      // 방의 currentPhase와 currentTurn 업데이트
      room.currentPhase = newPhase;
      room.currentTurn = newTurn;

      // 클라이언트에 phaseChange 이벤트 emit
      timerNamespace.to(roomId).emit('phaseChange', {
        newPhase,
        newTurn,
      });

      // 모든 사이클이 끝났는지 확인
      if (room.currentCycle >= room.cycleCount) {
        // 타이머 종료
        timerNamespace.to(roomId).emit('timerFinished');
        return;
      }
    }

    // 다음 단계 자동 시작
    startTimer(roomId);
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

  // 사이클 넘어가는 함수
  function skipToNextCycle(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    stopTimer(roomId);

    // 현재 사이클을 증가시키고 단계 인덱스 초기화
    room.currentCycle++;
    room.currentIndex = 0;

    // 모든 사이클이 끝났는지 확인
    if (room.currentCycle >= room.cycleCount) {
      // 타이머 종료
      timerNamespace.to(roomId).emit('timerFinished');
      return;
    }

    // 다음 사이클의 첫 번째 단계로 타이머 재시작
    startTimer(roomId);
  }
}

module.exports = { router, timerSocketHandler };