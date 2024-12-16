// routes/chat.js
const express = require('express');
const router = express.Router();
const Room = require("../schemas/room");
const userRooms = {};  // 사용자별 방 목록 저장
const { usersNumber } = require('../schemas/usersNumber');

function chatSocketHandler(io) {
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket) => {
    //console.log(`챗사용자 연결됨: ${socket.id}`);

    // 방 참가
    socket.on('join_room', async (roomId) => {
      
      try {
        socket.join(roomId);
        // 사용자별 방 목록 저장
        if (!userRooms[socket.id]) {
          userRooms[socket.id] = new Set();
        }
        userRooms[socket.id].add(roomId);
        //console.log(`챗사용자 ${socket.id}가 방 ${roomId}에 참가했습니다.`);

        if (!usersNumber[roomId]) {
          usersNumber[roomId] = 0; // 방이 처음 생성되면 0으로 초기화
        }
        usersNumber[roomId] += 1;

        //console.log(`현재 인원: ${usersNumber[roomId]}`);

      } catch (error) {
        console.error(`챗사용자 참가 중 에러 발생: ${error.message}`);
      }
    });

    // 메시지 전송
    socket.on('send_message', (data) => {
      //console.log(`방 ${data.roomId}에 메시지 전송: ${data.message}`);
      socket.to(data.roomId).emit('receive_message', data);
    });
    
    socket.on('egg_throw', (data) => {
      //console.log('계란 던지기 이벤트 수신:', data);
      socket.broadcast.emit('egg_throw', data); // 다른 클라이언트로 이벤트 전송
    });

    // 유저가 방을 떠날 때
    socket.on('disconnect', async () => {
      //console.log(`챗사용자 연결 해제됨: ${socket.id}`);

      const rooms = userRooms[socket.id] ? Array.from(userRooms[socket.id]) : [];

      try {
        for (const roomId of rooms) {
          // 방별 사용자 수 관리
          if (usersNumber[roomId]) {
            usersNumber[roomId] -= 1;
            //console.log(`방 ${roomId}의 현재 인원: ${usersNumber[roomId]}`);

            // // 데이터베이스 업데이트 및 방 삭제
            // if (usersNumber[roomId] === 0) {
            //   delete usersNumber[roomId];

              // 1초 딜레이 후 방 삭제
            setTimeout(async () => {
              try {
                if (usersNumber[roomId] === 0) {
                  delete usersNumber[roomId];
                  await Room.deleteOne({ roomNumber: roomId });
                  //console.log(`방 ${roomId}가 1초 딜레이 후 삭제되었습니다.`);
                  }
                } catch (error) {
                console.error(`방 ${roomId} 삭제 중 에러 발생: ${error.message}`);
              }
            }, 1000); // 1초 = 1000ms
            
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

