// src/components/Elements/TestChat/TestChat.jsx

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import useSocket from "../../useSocket"; // 커스텀 훅 가져오기
import { getVoteCount, increaseVoteCount } from "../../../votecount.js"; // voteCount.js에서 가져오기
import "./TestChat.css";
import VoteModal from "../../Modals/VoteModal/VoteModal"; // 모달 컴포넌트
import EmojiButton from "../../../components/Elements/Buttons/EmojiButton/EmojiButton";
import MatterCanvas from "./MatterCanvas"; // MatterCanvas 컴포넌트 추가

const TestChat = () => {
  const { roomNumber } = useParams(); // URL에서 roomNumber 가져오기
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태
  const [voteCount, setVoteCount] = useState(0); // 투표권 상태

  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token");
  const username = token ? getUsernameFromToken(token) : "Unknown";

  const isObserver = window.location.pathname.includes("/observer"); // 옵저버인지 판단
  const socket = useSocket("/chat", roomNumber); // 소켓 연결

  // 사용자 이름과 고유 색상을 매핑하는 객체
  const [userColors, setUserColors] = useState({});

  // 디버깅: roomNumber 출력
  useEffect(() => {
    console.log(`Current roomNumber: ${roomNumber}`);

    // voteCount.js의 getVoteCount 함수 호출 디버깅
    const { maxVoteCount, usedVoteCount } = getVoteCount(roomNumber, username);
    console.log("Initial Vote Counts:", maxVoteCount, usedVoteCount);

    // 10초마다 투표권을 증가시키는 로직
    const interval = setInterval(() => {
      console.log("Increasing Vote Count...");
      increaseVoteCount(roomNumber, username);  // 투표권 증가 함수 호출
      const { maxVoteCount, usedVoteCount } = getVoteCount(roomNumber, username);
      console.log("After Increasing Vote Count:", maxVoteCount, usedVoteCount);
    }, 10000);  // 10초마다 증가시키는 함수 호출

    return () => {
      clearInterval(interval);  // clean up on unmount
    };
  }, [roomNumber, username]);

  useEffect(() => {
    // 본인의 색상을 초기화
    setUserColors((prevColors) => {
      if (!prevColors[username]) {
        return {
          ...prevColors,
          [username]: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // 랜덤 색상 생성
        };
      }
      return prevColors; // 기존 색상을 유지
    });

    if (!socket) return;

    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);


      // 새로운 사용자가 추가되었을 경우 고유 색상 부여
      setUserColors((prevColors) => {
        if (!prevColors[data.author]) {
          return {
            ...prevColors,
            [data.author]: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          };
        }
        return prevColors;
      });
    });

    return () => {
      socket.off("receive_message");
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
        time: new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setMessage("");
    }
  };

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div className="chat-window" style={{ position: "relative" }}>
      <div className="chat-header">
        <p>실시간 채팅</p>
      </div>
      <div className="chat-body">
        {messageList.map((msgContent, index) => (
          <div
            key={index}
            className={`message ${msgContent.author === username ? "you" : "other"}`}
          >
            <div className="message-avatar"
              style={{
                backgroundColor: userColors[msgContent.author] || "#000",
                fontSize: 18,
              }}>👀</div>
            <div>
              <div className="message-content">
                <div className='author-message'
                  style={{
                    marginRight: "10px",
                    fontWeight: "bold",
                    fontSize: "clamp(11px, 1vw, 12px)",
                    minWidth: "60px",
                    maxWidth: "60px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: userColors[msgContent.author] || "#000",
                    
                  }}
                >
                  {msgContent.author}
                  <div className="message-meta"
                    style={{
                      color: userColors[msgContent.author] || "#000",
                    }}>{msgContent.time}
                  </div>
                </div>
                <div className='user-message'
                  style={{
                    color: userColors[msgContent.author] || "#000",
                    border: `1.3px solid ${userColors[msgContent.author] || "#000"}`,
                  }}>
                  {msgContent.message}
                </div>
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
          <EmojiButton onEmojiSelect={(emoji) => setMessage((prev) => prev + emoji)} />
          {isObserver && (
            <button className="modal-button" onClick={toggleModal}>
              <img src="/resources/images/egg.png" alt="Modal" className="modal-icon" style={{ width: "20px", height: "auto" }} />
            </button>
          )}
        </div>
      </div>

      {/* 모달 컴포넌트 */}
      {isModalOpen && <VoteModal toggleModal={toggleModal} voteCount={voteCount} roomNumber={roomNumber} />}

      {/* Matter.js 캔버스 영역 */}
      {socket && <MatterCanvas roomNumber={roomNumber} socket={socket} />}
    </div >
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

