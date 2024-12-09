import React, { useEffect, useState, useRef } from "react";
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
  const [messageList, setMessageList] = useState([]); // 메시지 리스트
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태
  const [voteCount, setVoteCount] = useState(0); // 투표권 상태

  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token");
  const username = token ? getUsernameFromToken(token) : "Unknown";

  const isObserver = window.location.pathname.includes("/observer"); // 옵저버인지 판단
  const socket = useSocket("/chat", roomNumber); // 소켓 연결
  const timersocket = useSocket("/timer", roomNumber); // 소켓 연결

  const [userColors, setUserColors] = useState({}); // 사용자별 색상

  useEffect(() => {
    //console.log(`Current roomNumber: ${roomNumber}`);

    const { maxVoteCount, usedVoteCount } = getVoteCount(roomNumber, username);
    //console.log("Initial Vote Counts:", maxVoteCount, usedVoteCount);

    const voteIncrease = 2;
    const session = window.session;
    // OpenVidu "signal:phaseChange" 이벤트 핸들러
    const handleSessionPhaseChange = (event) => {
        //console.log("Phase Change detected from session:", event.data);
        try {
            const data = JSON.parse(event.data); // 데이터 파싱
            //console.log("Parsed phaseChange data from session:", data);
            repeatIncreaseVoteCount(roomNumber, username, voteIncrease);
        } catch (error) {
            console.error("Error in increaseVoteCount from session:", error);
        }

        const { maxVoteCount, usedVoteCount } = getVoteCount(roomNumber, username);
        //console.log("After Phase Change (session) - Vote Counts:", maxVoteCount, usedVoteCount);
    };

    // Socket.io "phaseChange" 이벤트 핸들러
    const handleSocketPhaseChange = (data) => {
        //console.log("Phase Change detected from timersocket:", data);
        try {
            repeatIncreaseVoteCount(roomNumber, username, voteIncrease);
        } catch (error) {
            console.error("Error in increaseVoteCount from timersocket:", error);
        }

        const { maxVoteCount, usedVoteCount } = getVoteCount(roomNumber, username);
        //console.log("After Phase Change (timersocket) - Vote Counts:", maxVoteCount, usedVoteCount);
    };

    // OpenVidu "signal:phaseChange" 이벤트 등록
    if (session) {
        session.on("signal:phaseChange", handleSessionPhaseChange);
    }

    // Socket.io "phaseChange" 이벤트 등록
    if (timersocket) {
        timersocket.on("phaseChange", handleSocketPhaseChange);
    }

    // 클린업: 두 이벤트 리스너 모두 제거
    return () => {
        if (session) {
            session.off("signal:phaseChange", handleSessionPhaseChange);
        }
        if (timersocket) {
            timersocket.off("phaseChange", handleSocketPhaseChange);
        }
    };
  }, [roomNumber, username, timersocket]);

  const repeatIncreaseVoteCount = (roomNumber, username, n) => {
    for (let i = 0; i < n; i++) {
      increaseVoteCount(roomNumber, username);
    }
    //console.log(`increaseVoteCount called ${n} times.`);
  };
  useEffect(() => {
    //console.log(`Current roomNumber: ${roomNumber}`);

    const { maxVoteCount, usedVoteCount } = getVoteCount(roomNumber, username);
    //console.log("Initial Vote Counts:", maxVoteCount, usedVoteCount);

    const interval = setInterval(() => {
      increaseVoteCount(roomNumber, username);
      const { maxVoteCount, usedVoteCount } = getVoteCount(roomNumber, username);
      //console.log("After Increasing Vote Count:", maxVoteCount, usedVoteCount);
    }, 10000); // 10초마다 증가시키는 함수 호출

    return () => {
      clearInterval(interval); // clean up on unmount
    };
  }, [roomNumber, username]);

  useEffect(() => {
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
      let profileImageUrl = "";
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          profileImageUrl = payload.profileImageUrl || "";
        } catch (error) {
          console.error("토큰 파싱 오류:", error);
        }
      }

      const messageData = {
        roomId: roomNumber,
        author: username,
        message: message,
        profileImageUrl, // 프로필 이미지 URL 추가
        time: new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      socket.emit("send_message", messageData); // 메시지 전송
      setMessageList((list) => [...list, messageData]); // 로컬 리스트에도 추가
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
            <div
              className="message-avatar"
              style={{
                backgroundColor: userColors[msgContent.author] || "#000",
                fontSize: 18,
                display: "flex",
                // alignItems: "center",
                // justifyContent: "center",
                overflow: "hidden",
                borderRadius: "50%", // 원형
                width: "40px",
                height: "40px",
              }}
            >
              {msgContent.profileImageUrl ? (
                <img
                  src={msgContent.profileImageUrl}
                  alt={`${msgContent.author}님의 프로필`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                "👀"
              )}
            </div>
            <div>
              <div className="message-content">
                <div
                  className="author-message"
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
                  <div
                    className="message-meta"
                    style={{
                      color: userColors[msgContent.author] || "#000",
                    }}
                  >
                    {msgContent.time}
                  </div>
                </div>
                <div
                  className="user-message"
                  style={{
                    color: userColors[msgContent.author] || "#000",
                    border: `1.3px solid ${userColors[msgContent.author] || "#000"}`,
                  }}
                >
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
          <div className="input-container">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="채팅을 입력해주세요"
            />
            <div className="emoji-button-container">
              <EmojiButton
                onEmojiSelect={(emoji) => setMessage((prev) => prev + emoji)}
                className="emoji-buttons"
              />
            </div>
          </div>
          {isObserver && (
            <button className="modal-button" onClick={toggleModal}>
              <img
                src="/resources/images/egg.png"
                alt="Modal"
                className="modal-icon"
                style={{ width: "20px", height: "auto" }}
              />
            </button>
          )}
        </div>
      </div>

      {isModalOpen && (
        <VoteModal toggleModal={toggleModal} voteCount={voteCount} roomNumber={roomNumber} />
      )}

      {socket && <MatterCanvas roomNumber={roomNumber} socket={socket} />}
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
