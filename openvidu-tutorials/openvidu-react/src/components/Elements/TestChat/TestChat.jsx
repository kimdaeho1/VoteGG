import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import useSocket from "../../useSocket"; // 커스텀 훅 가져오기
import "./TestChat.css";
import VoteModal from "../../Modals/VoteModal/VoteModal"; // 모달 컴포넌트

const TestChat = () => {
  const { roomNumber } = useParams(); // URL에서 roomId 받기
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태
  const [voteCount, setVoteCount] = useState(0); // 투표권 상태
  const messagesEndRef = useRef(null);

  // 토큰에서 사용자 이름 추출
  const token = localStorage.getItem("token");
  const username = token ? getUsernameFromToken(token) : "Unknown User";

  // 옵저버인지 룸인지 구분
  const isObserver = window.location.pathname.includes('/observer');  // 옵저버인지 판단

  const socket = useSocket("/chat", roomNumber); // 소켓 연결

  useEffect(() => {
    if (!socket) return;

    // 소켓 메시지 수신 이벤트 등록
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    // 소켓에서 투표권 업데이트 이벤트 받기
    socket.on("update_vote_count", ({ userId, voteCount }) => {
      if (userId === socket.id) {
        setVoteCount(voteCount); // 본인의 투표권 업데이트
      }
    });

    // 정리 함수
    return () => {
      socket.off("receive_message");
      socket.off("update_vote_count");
    };
  }, [socket]);

  useEffect(() => {
    // 메시지 목록이 업데이트될 때마다 자동 스크롤
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  const sendMessage = () => {
    if (message.trim() && socket) {
      const messageData = {
        roomId: roomNumber,
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
          {/* 옵저버일 경우만 모달 열기 버튼 표시 */}
          {isObserver && (
            <button className="modal-button" onClick={toggleModal}>
              <img src="/ticket.jpg" alt="Modal" className="modal-icon" />
            </button>
          )}
        </div>
      </div>

      {/* 모달 컴포넌트 */}
      {isModalOpen && <VoteModal toggleModal={toggleModal} voteCount={voteCount} />}
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
