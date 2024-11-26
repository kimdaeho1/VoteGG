import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import useSocket from "../../useSocket"; // 커스텀 훅 가져오기
import "./TestChat.css";
import VoteModal from "../../Modals/VoteModal/VoteModal"; // 모달 컴포넌트

import EmojiButton from "../../../components/Elements/Buttons/EmojiButton/EmojiButton";

const TestChat = () => {
  const { roomNumber } = useParams(); // URL에서 roomNumber 가져오기
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태
  const [voteCount, setVoteCount] = useState(() => {
    const storedVotes = JSON.parse(localStorage.getItem("votes")) || {};
    return storedVotes[roomNumber] || 0;
  });
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token");
  const username = token ? getUsernameFromToken(token) : "Unknown User";

  const isObserver = window.location.pathname.includes("/observer"); // 옵저버인지 판단
  const socket = useSocket("/chat", roomNumber); // 소켓 연결

  // 디버깅: roomNumber 출력
  useEffect(() => {
    console.log(`Current roomNumber: ${roomNumber}`);
  }, [roomNumber]);

  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    socket.on("update_vote_count", ({ userId, voteCount }) => {
      if (userId === socket.id) {
        setVoteCount(voteCount);
        const storedVotes = JSON.parse(localStorage.getItem("votes")) || {};
        storedVotes[roomNumber] = voteCount;
        localStorage.setItem("votes", JSON.stringify(storedVotes)); // 투표권 저장
        console.log(`투표권 업데이트: 방 ID=${roomNumber}, 투표권=${voteCount}`);
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("update_vote_count");
    };
  }, [socket, roomNumber]);

  useEffect(() => {
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
          <EmojiButton
            onEmojiSelect={(emoji) => setMessage((prev) => prev + emoji)}
          />
          {isObserver && (
            <button className="modal-button" onClick={toggleModal}>
              <img src="/ticket.jpg" alt="Modal" className="modal-icon" />
            </button>
          )}
        </div>
      </div>
      {isModalOpen && <VoteModal toggleModal={toggleModal} voteCount={voteCount} roomNumber={roomNumber} />}
    </div>
  );
};

export default TestChat;

const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username;
  } catch (error) {
    console.error("Failed to parse token:", error);
    return "Unknown User";
  }
};
