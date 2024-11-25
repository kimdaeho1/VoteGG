import React, { useState, useEffect } from "react";
import useSocket from "../../../useSocket";
import { useParams } from 'react-router-dom';

const EndButton = () => {
  const { roomNumber } = useParams(); 
  const roomId = roomNumber;
  const socket = useSocket("/invite", roomId); // useSocket 훅을 통해 소켓 연결
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const username = token ? getUsernameFromToken(token) : "Unknown User";

  const handleButtonClick = () => {
    if (socket) {
      socket.emit("button_click", { username, message: "Hello from Client!" });
      console.log("Message sent to server!");
    }
  };

  useEffect(() => {
    if (socket) {
      // 서버에서 응답 처리
      socket.on("response_invite", (data) => {
        console.log("Received message from server:", data.message);
        setMessage(data.message);
      });

      // 언마운트 시 이벤트 정리
      return () => {
        socket.off("response_invite");
      };
    }
  }, [socket]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Chat Room: {roomId}</h1>
      <button onClick={handleButtonClick} style={{ padding: "10px 20px", fontSize: "16px" }}>
        Send Message
      </button>
      {message && <p>Server Response: {message}</p>}
    </div>
  );
};

export default EndButton;


// Utility Function for Token Decoding
const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // JWT payload parsing
    return payload.username; // Extract username
  } catch (error) {
    console.error("Failed to parse token:", error);
    return "Unknown User";
  }
};
