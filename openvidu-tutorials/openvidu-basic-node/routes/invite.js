const express = require('express');
const router = express.Router();
// const Room = require("../schemas/room");
const userRooms = {}; // 사용자별 방 목록 저장

function inviteSocketHandler(io) {
  // Namespace 혹은 Path 설정
  const inviteNamespace = io.of('/invite');

  inviteNamespace.on('connection', (socket) => {
    console.log(`사용자 연결됨: ${socket.id}`);

    // 방 참가
    socket.on('join_room', async (roomId) => {
      try {
        socket.join(roomId);
        // 사용자별 방 목록 저장
        if (!userRooms[socket.id]) {
          userRooms[socket.id] = new Set();
        }
        userRooms[socket.id].add(roomId);
        console.log(`사용자 ${socket.id}가 방 ${roomId}에 참가했습니다.`);
      } catch (error) {
        console.error(`방 참가 중 에러 발생: ${error.message}`);
      }
    });

    // 버튼 클릭 이벤트 처리
    socket.on("button_click", ({ roomId, message }) => {
        console.log(`Button clicked in room ${roomId}: ${message}`);
        // 같은 방에 있는 클라이언트에게 응답
        io.to(roomId).emit("response_invite", { message: `Room ${roomId}: Chat ended!` });
    });
    
    socket.on('disconnect', async () => {
      console.log(`사용자 연결 해제됨: ${socket.id}`);
    });
    
  });
}

module.exports = { router, inviteSocketHandler };