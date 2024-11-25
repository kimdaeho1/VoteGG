const express = require('express');
const router = express.Router();
const Room = require("../schemas/room");
const userRooms = {};  // 사용자별 방 목록 저장
const userVotes = {};  // 사용자별, 방별 투표권 관리

function chatSocketHandler(io) {
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket) => {
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

        // 방별 투표권 초기화
        if (!userVotes[roomId]) {
          userVotes[roomId] = {};
        }

        // 각 유저의 초기 투표권을 설정 (기본값 0)
        if (!userVotes[roomId][socket.id]) {
          userVotes[roomId][socket.id] = 0;
        }

        console.log(`사용자 ${socket.id}가 방 ${roomId}에 참가했습니다.`);

        // 투표권 증가를 위한 setInterval
        setInterval(() => {
          if (userVotes[roomId]) {
            userVotes[roomId][socket.id] += 1;  // 유저의 투표권 증가
            socket.emit("update_vote_count", {
              userId: socket.id,
              voteCount: userVotes[roomId][socket.id],
            });
          }
        }, 10000);  // 10초마다 투표권 증가

        await Room.findOneAndUpdate(
          { roomNumber: roomId },
          { $inc: { memberCount: 1 } },
          { new: true }
        );
        console.log(`방 ${roomId}의 memberCount가 증가했습니다.`);
      } catch (error) {
        console.error(`방 참가 중 에러 발생: ${error.message}`);
      }
    });

    // 메시지 전송
    socket.on('send_message', (data) => {
      console.log(`방 ${data.roomId}에 메시지 전송: ${data.message}`);
      socket.to(data.roomId).emit('receive_message', data);
    });

    // 유저가 방을 떠날 때
    socket.on('disconnect', async () => {
      console.log(`사용자 연결 해제됨: ${socket.id}`);

      const rooms = userRooms[socket.id] ? Array.from(userRooms[socket.id]) : [];
      console.log(`사용자 ${socket.id}가 참가한 방 목록:`, rooms);

      try {
        for (const roomId of rooms) {
          // 방에 참여한 모든 유저들에 대해 투표권 삭제
          if (userVotes[roomId] && userVotes[roomId][socket.id]) {
            userVotes[roomId][socket.id] = 0;  // 유저의 투표권 초기화
            console.log(`유저 ${socket.id}의 투표권이 방 ${roomId}에서 초기화되었습니다.`);
          }

          // 데이터베이스에서 방 업데이트
          const updatedRoom = await Room.findOneAndUpdate(
            { roomNumber: roomId, memberCount: { $gt: 0 } },
            { $inc: { memberCount: -1 } },
            { new: true }
          );
          console.log(`인구 다운 ${roomId}`);

          if (updatedRoom && updatedRoom.memberCount === 0) {
            await Room.deleteOne({ roomNumber: roomId });
            console.log(`방 ${roomId}가 삭제되었습니다.`);
          }
        }

        // 방 목록에서 사용자 제거
        delete userRooms[socket.id];
      } catch (error) {
        console.error(`연결 해제 처리 중 에러 발생: ${error.message}`);
      }
    });

  });
}

module.exports = { router, chatSocketHandler };
