import React, { useState, useEffect } from "react";
import axios from "axios"; // axios 추가
import { handleVote, getVoteCount } from "../../../votecount.js"; // handleVote 함수 가져오기
import "./VoteModal.css";
import { useToast } from "../../Elements/Toast/ToastContext.jsx";
import jwtDecode from 'jwt-decode'; // jwt-decode 라이브러리 임포트

const getUsernameFromToken = (token) => {
  try {
    const decoded = jwtDecode(token); // JWT 디코딩
    return decoded.username || 'Unknown User'; // username 반환, 없을 시 기본값
  } catch (error) {
    console.error('Failed to decode token:', error);
    return 'Unknown User';
  }
};

const VoteModal = ({ toggleModal, roomNumber }) => {
  const token = localStorage.getItem("token");
  const userId = token ? getUsernameFromToken(token) : "Unknown User";

  const [currentVote, setCurrentVote] = useState(0); // 현재 투표권
  const [participants, setParticipants] = useState([]); // 참가자 목록
  const [selectedParticipant, setSelectedParticipant] = useState(""); // 선택된 참가자
  const [remainingVoteCount, setRemainingVoteCount] = useState(0); // 남은 투표권 상태

  const { addToast } = useToast();

  // 로컬스토리지에서 최대 투표권과 사용된 투표권을 가져옴
  useEffect(() => {
    const { maxVoteCount, usedVoteCount } = getVoteCount(roomNumber, userId);
    setRemainingVoteCount(maxVoteCount - usedVoteCount); // 남은 투표권 계산
  }, [roomNumber, userId]);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        //console.log(`Fetching participants for roomNumber: ${roomNumber}`);
        const response = await axios.get(`/api/room/${roomNumber}/participants`);
        const participantsArray = Array.isArray(response.data) ? response.data : [];
        //console.log("Participants received from server:", participantsArray);

        // 본인을 제외한 참가자 목록으로 설정
        const filteredParticipants = participantsArray.filter(
          ([participantId]) => participantId !== userId
        );
        setParticipants(filteredParticipants);
      } catch (error) {
        console.error("Failed to fetch participants:", error.message);
      }
    };

    if (roomNumber) {
      fetchParticipants();
    }
  }, [roomNumber, userId]);

  // 투표 처리
  const handleVoteClick = async () => {
    if (!selectedParticipant) {
      addToast("투표할 참가자를 선택해주세요.", "error");
      return;
    }

    if (currentVote <= 0) {
      addToast("1 이상의 투표권을 사용해야 합니다.", "error");
      return;
    }

    const updatedRemainingVoteCount = await handleVote(
      roomNumber,
      userId,
      selectedParticipant,
      currentVote,
      remainingVoteCount,
      addToast,
    );

    if (updatedRemainingVoteCount !== undefined) {
      setRemainingVoteCount(updatedRemainingVoteCount); // 남은 투표권 갱신
      setCurrentVote(0); // 투표 후 슬라이더 초기화
      toggleModal(); // 투표 완료 후 모달 닫기
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <button onClick={toggleModal} className="close-button">
          X
        </button>
        <h3>추천</h3>
        <p>남은 달걀: {remainingVoteCount}개</p>

        {/* 참가자 목록 */}
        <h4>참가자 목록</h4>
        <div className="participant-list">
          {participants.length > 0 ? (
            participants.map(([participantId], index) => (
              <div
                key={index}
                className={`participant-card ${
                  selectedParticipant === participantId ? "selected" : ""
                }`}
                onClick={() => setSelectedParticipant(participantId)}
              >
                <span style={{ fontWeight: "bold" }}>{participantId}</span>
              </div>
            ))
          ) : (
            <p>참가자가 없습니다.</p>
          )}
        </div>

        {/* 투표 슬라이더 */}
        <label htmlFor="voteRange" >
          <div className="egg-container">
            {Array.from({ length: Math.min(currentVote, 10) }, (_, index) => (
              <img
                key={index}
                src="/resources/images/egg.png"
                alt="Egg"
                className="modal-icon"
                style={{ width: "20px", height: "auto" }}
              />
            ))}
          </div>
        </label>
        <input
          type="range"
          id="voteRange"
          className="form-range"
          min="0"
          max={remainingVoteCount}
          value={currentVote}
          onChange={(e) => setCurrentVote(Number(e.target.value))}
        />
        <p>{currentVote}개 사용하기</p>

        {/* 투표 버튼 */}
        <button onClick={handleVoteClick} className="vote-button">
          추천하기
        </button>
      </div>
    </div>
  );
};

export default VoteModal;
