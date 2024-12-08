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
    //console.log(`타이머 네임스페이스에 새로운 클라이언트 연결: ${socket.id}`);

    // 방에 조인하는 이벤트 처리
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      //console.log(`타이머방 ${socket.id}가 방 ${roomId}에 참여했습니다.`);

      // 해당 방의 타이머가 없으면 생성
      if (!rooms[roomId]) {
        // 타이머 초기 설정
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
          stopRequests: 0, // 종료 요청 상태 추가
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

    socket.on('toggle_ready', ({ roomId, isReady }) => {
      const room = rooms[roomId];
      if (!room) return;
    
      // 준비 상태 업데이트
      room.readyCount += isReady ? 1 : -1;
      room.readyCount = Math.max(0, room.readyCount); // 음수로 가지 않도록 보장
    
      // 모든 클라이언트에게 준비 상태 업데이트 전송
      timerNamespace.to(roomId).emit('update_ready_count', room.readyCount);
    
      //console.log(`방 ${roomId}의 준비된 사용자 수: ${room.readyCount}`);
    });
    

    socket.on('toggle_stop_request', ({ roomId, requested }) => {
      const room = rooms[roomId];
      if (!room) return;

      // 종료 요청 수 업데이트
      room.stopRequests += requested ? 1 : -1;
      room.stopRequests = Math.max(0, room.stopRequests);

      //console.log(`방 ${roomId}의 종료 요청 상태: ${room.stopRequests}`);

      // 모든 클라이언트에게 종료 요청 수 업데이트 브로드캐스트
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
        //console.log(`방 ${roomId}의 타이머가 종료되었습니다.`);
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
        room.timeLeft = 0; // 타이머 시간을 강제로 0초로 설정
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
        // 강제로 모든 사이클을 완료로 설정하여 종료 조건을 만족시킴
        room.currentCycle = room.cycleCount;
        handleVotingAndResults(roomId);
      }
    });

    // 타이머 시간 설정 이벤트 처리
    socket.on('set_timer_duration', ({ roomId, duration }) => {
      const room = rooms[roomId];
      if (room) {
        room.durations[0] = duration; // 첫 번째 단계의 지속 시간을 설정
        room.timeLeft = duration; // 남은 시간도 업데이트
        //console.log(`방 ${roomId}의 타이머가 ${duration}초로 설정되었습니다.`);

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
      //console.log('타이머방 연결 해제:', socket.id);

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
            //console.log(`타이머방 ${roomId}의 타이머가 정리되었습니다.`);
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
        // 양측 참가자들의 발언이 끝나면 다음 phase로 이동
        newTurn = 'left';
        newPhase = room.currentPhase === 1 ? 1 : 1; // Phase를 1과 2 사이에서 변경
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
        // 타이머 종료 및 투표 결과 처리
        handleVotingAndResults(roomId);
        return;
      }
    }

    // 다음 단계 자동 시작
    startTimer(roomId);
  }

  // 타이머 종료 후 투표 및 결과 처리 함수
  async function handleVotingAndResults(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    try {

      // roomId에 해당하는 Room 문서 가져오기
      const roomDocument = await Room.findOne({ roomNumber: roomId });

      if (!roomDocument) {
        console.error(`roomId ${roomId}에 해당하는 방을 찾을 수 없습니다.`);
        return;
      }

      const participantsArray = Array.from(roomDocument.participant.entries());

      if (participantsArray.length < 1) {
        //console.log("참가자가 부족합니다. 최소 4명이 필요합니다.");
        // 클라이언트에게 에러 메시지 전송
        timerNamespace.to(roomId).emit('timerFinished', { error: "참가자가 부족합니다. 최소 4명이 필요합니다." });
        return;
      }

      // Red팀과 Blue팀 나누기
      const redTeam = participantsArray.slice(0, 2); // 0, 1번 참가자
      const blueTeam = participantsArray.slice(2, 4); // 2, 3번 참가자

      // 점수 계산
      const redScore = redTeam.reduce((sum, [, votes]) => sum + votes, 0);
      const blueScore = blueTeam.reduce((sum, [, votes]) => sum + votes, 0);

      // 전체 참가자 정보 가져오기
      const participantIds = participantsArray.map(([id]) => id);
      const users = await User.find({ username: { $in: participantIds } });

      // 결과 업데이트
      for (const user of users) {
        user.totalParticipations += 1; // 모든 참가자의 참가 횟수 증가

        const isRedTeam = redTeam.some(([id]) => id === user.username);
        const isBlueTeam = blueTeam.some(([id]) => id === user.username);

        if (redScore === blueScore) {
          // 동점인 경우 모두 승리
          user.totalWins += 1;
        } else if (
          (isRedTeam && redScore > blueScore) ||
          (isBlueTeam && blueScore > redScore)
        ) {
          // 자신의 팀이 승리한 경우
          user.totalWins += 1;
        }
      }

      // 최대 득표자 계산
      const maxVotes = Math.max(...participantsArray.map(([, votes]) => votes));
      const topScorers = users.filter((user) =>
        participantsArray.some(
          ([id, votes]) => id === user.username && votes === maxVotes
        )
      );

      // 최대 득표자 업데이트
      for (const topScorer of topScorers) {
        topScorer.firstPlaceWins += 1;
      }
      
      // DB 업데이트
      await Promise.all(users.map((user) => user.save()));

      
      // 토론 결과 저장
      const debateResult = new DebateResult({
        roomName: roomDocument.roomname,
        tags: roomDocument.tags,
        maxViewers : roomDocument.maxViewers,
        participantsArray: Array.from(roomDocument.participant.entries()), // Map을 배열로 저장
      });
      
      await debateResult.save();
      //console.log("토론 결과가 성공적으로 저장되었습니다.");

      //console.log("투표 결과가 성공적으로 처리되었습니다.");
// =======
//         // 클라이언트에게 결과 전송
//         timerNamespace.to(roomId).emit('timerFinished', {
//           message: "투표 결과가 성공적으로 처리되었습니다.",
//           redScore: redScore || 0,
//           blueScore: blueScore || 0,
//           topScorers: topScorers.map((user) => user.username),
//         });
//       } catch (error) {
//         console.error("투표 결과 처리 중 오류:", error);
//         // 클라이언트에게 오류 메시지 전송
//         timerNamespace.to(roomId).emit('timerFinished', { error: "투표 결과를 처리하는 중 오류가 발생했습니다." });
//       }
// >>>>>>> main

      // 클라이언트에게 결과 전송
      timerNamespace.to(roomId).emit('timerFinished', {
        message: "투표 결과가 성공적으로 처리되었습니다.",
        redScore,
        blueScore,
        topScorers: topScorers.map((user) => user.username),
      });
    } catch (error) {
      console.error("투표 결과 처리 중 오류:", error);
      // 클라이언트에게 오류 메시지 전송
      timerNamespace.to(roomId).emit('timerFinished', { error: "투표 결과를 처리하는 중 오류가 발생했습니다." });
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
