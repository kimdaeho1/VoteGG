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
      console.log(`클라이언트 ${socket.id}가 방 ${roomId}에 참여했습니다.`);

      // 해당 방의 타이머가 없으면 생성
      if (!rooms[roomId]) {
        // 타이머 초기 설정
        rooms[roomId] = {
          duration: 180, // 총 시간 (초)
          startTime: Date.now(),
          interval: null,
          timeLeft: 180,
        };

        // 1초마다 타이머 업데이트
        rooms[roomId].interval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - rooms[roomId].startTime) / 1000);
          rooms[roomId].timeLeft = Math.max(rooms[roomId].duration - elapsed, 0);

          // 타이머가 끝나면 인터벌 클리어
          if (rooms[roomId].timeLeft <= 0) {
            clearInterval(rooms[roomId].interval);
            rooms[roomId].interval = null;
          }

          // 방에 있는 모든 클라이언트에게 타이머 업데이트 전송
          timerNamespace.to(roomId).emit('timerUpdate', rooms[roomId].timeLeft);
        }, 1000);
      } else {
        // 기존 타이머의 남은 시간을 전송
        const elapsed = Math.floor((Date.now() - rooms[roomId].startTime) / 1000);
        rooms[roomId].timeLeft = Math.max(rooms[roomId].duration - elapsed, 0);

        socket.emit('timerUpdate', rooms[roomId].timeLeft);
      }
    });

    // 클라이언트 연결 해제 시 처리
    socket.on('disconnect', () => {
      console.log('클라이언트 연결 해제:', socket.id);

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
            clearInterval(rooms[roomId].interval);
            delete rooms[roomId];
            console.log(`방 ${roomId}의 타이머가 정리되었습니다.`);
          }
        }
      });
    });
  });
}

module.exports = { router, timerSocketHandler };
