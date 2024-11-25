import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import useSocket from "../../useSocket"; // 커스텀 훅 가져오기
import "./TestChat.css";
import VoteModal from "../../Modals/VoteModal/VoteModal";

const TestChat = () => {
  const { roomNumber } = useParams();
  const roomId = roomNumber;
  const socket = useSocket(roomId); // 소켓 연결 가져오기
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // 이미지 파일을 변경하고 싶은 경우, 원하는 이미지 URL로 변경하세요
  const buttonImageUrl = "/your-image-path.jpg"; // 원하는 이미지 파일 경로를 지정

  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  const sendMessage = () => {
    if (message.trim() && socket) {
      const messageData = {
        roomId: roomId,
        author: "User", // 사용자 이름을 넣을 수 있음
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
            className={`message ${msgContent.author === "User" ? "you" : "other"}`}
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
        <div ref={messagesEndRef} />
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
