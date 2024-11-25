import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import useSocket from "../../useSocket"; // 커스텀 훅 가져오기
import "./TestChat.css";
import VoteModal from "../../Modals/VoteModal/VoteModal"; // 모달 컴포넌트

import ChatOverlay from "../openvidu/ChatOverlay";

const TestChat = () => {
  const { roomNumber } = useParams(); // URL의 :id 부분 추출
  const roomId = roomNumber;
  const socket = useSocket("/chat", roomId); // 소켓 연결 가져오기
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태 추가
  const messagesEndRef = useRef(null);

  // 토큰에서 사용자 이름 추출
  const token = localStorage.getItem("token");
  const username = token ? getUsernameFromToken(token) : "Unknown User";

  useEffect(() => {
    if (!socket) return;

    // 소켓 메시지 수신 이벤트 등록
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    // 정리 함수
    return () => {
      socket.off("receive_message");
    };
  }, [socket]);

  useEffect(() => {
    // 메시지 목록이 업데이트될 때마다 자동 스크롤
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  const sendMessage = () => {
    if (message.trim() && socket) {
      const messageData = {
        roomId: roomId,
        author: username,
        message: message,
        time: new Date().toLocaleTimeString(),
      };
      socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setMessage("");
    }
  };

  // 모달 열기/닫기 함수
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <p>실시간 채팅</p>
      </div>
      <div className="chat-body">
        {messageList.map((msgContent, index) => (
          <div
            key={index}
            className={`message ${msgContent.author === username ? "you" : "other"}`}
          >
            <div className="message-avatar"></div>
            <div>
              <div className="message-content">{msgContent.message}</div>
              <div className="message-meta">
                {msgContent.time} - {msgContent.author}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* 스크롤 끝 참조 요소 */}
      </div>
      <div className="chat-footer">
        <div className="input-wrapper">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder="채팅 입력"
          />
          <button className="room-send-button" onClick={sendMessage}>
            <img src="/send.png" alt="Send" className="send-icon" />
          </button>
          {/* 모달 열기 버튼 추가 */}
          <button className="modal-button" onClick={toggleModal}>
            <img src="/ticket.jpg" alt="Modal" className="modal-icon" />
          </button>
        </div>
      </div>
      
      {/* 모달 컴포넌트 */}
      {isModalOpen && <VoteModal toggleModal={toggleModal} />}
    </div>
  );
};

export default TestChat;

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
