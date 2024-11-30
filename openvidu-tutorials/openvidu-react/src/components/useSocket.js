// src/components/useSocket.js

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const useSocket = (namespace, roomId) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!roomId) {
      console.error("Room ID가 없습니다.");
      return;
    }

    // 소켓 연결 생성
    const newSocket = io(window.location.origin + namespace, {
      path: "/socket.io/",
      transports: ["websocket"],
      query: { debug: true },
    });

    setSocket(newSocket);

    // 소켓 연결 및 방 참여
    newSocket.on("connect", () => {
      console.log(namespace, "Socket connected:", newSocket.id);
      newSocket.emit("join_room", roomId);
    });

    // 컴포넌트 언마운트 시 소켓 정리
    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  return socket;
};

export default useSocket;
