import React, { useState, useEffect } from "react";
import { handleVote, getVoteCount } from "../../../votecount.js"; // handleVote 함수 가져오기
import "./VoteModal.css";

const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username;
  } catch (error) {
    console.error("Failed to parse token:", error);
    return "Unknown User";
  }
};

const VoteModal = ({ toggleModal, roomNumber }) => {
  const token = localStorage.getItem("token");
  const userId = token ? getUsernameFromToken(token) : "Unknown User";
  
  const [currentVote, setCurrentVote] = useState(0); // 현재 투표권
  const [participants, setParticipants] = useState([]); // 참가자 목록
  const [selectedParticipant, setSelectedParticipant] = useState(""); // 선택된 참가자
  const [remainingVoteCount, setRemainingVoteCount] = useState(0); // 남은 투표권 상태

  // 로컬스토리지에서 최대 투표권과 사용된 투표권을 가져옴
  const { maxVoteCount, usedVoteCount } = getVoteCount(roomNumber, userId);

  useEffect(() => {
    setRemainingVoteCount(maxVoteCount - usedVoteCount); // 남은 투표권 계산
  }, [maxVoteCount, usedVoteCount]);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        console.log(`Fetching participants for roomNumber: ${roomNumber}`);
        const response = await axios.get(`/api/room/${roomNumber}/participants`);
        const participantsArray = Array.isArray(response.data) ? response.data : [];
        console.log("Participants received from server:", participantsArray);
        setParticipants(participantsArray);
      } catch (error) {
        console.error("Failed to fetch participants:", error.message);
      }
    };

    if (roomNumber) {
      fetchParticipants();
    }
  }, [roomNumber]);

  // 투표 처리
  const handleVoteClick = async () => {
    const updatedRemainingVoteCount = await handleVote(
      roomNumber,
      userId,
      selectedParticipant,
      currentVote,
      remainingVoteCount,
      toggleModal
    );

    if (updatedRemainingVoteCount !== undefined) {
      setRemainingVoteCount(updatedRemainingVoteCount); // 남은 투표권 갱신
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <button onClick={toggleModal} className="close-button">
          X
        </button>
        <h3>투표</h3>
        <p>현재 투표권: {remainingVoteCount}</p>

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
                {participantId}
              </div>
            ))
          ) : (
            <p>참가자가 없습니다.</p>
          )}
        </div>

        {/* 투표 슬라이더 */}
        <label htmlFor="voteRange">투표권 소모:</label>
        <input
          type="range"
          id="voteRange"
          className="form-range"
          min="0"
          max={remainingVoteCount}
          value={currentVote}
          onChange={(e) => setCurrentVote(Number(e.target.value))}
        />
        <p>{currentVote} 투표권 사용</p>

        {/* 투표 버튼 */}
        <button onClick={handleVoteClick} className="vote-button">
          투표하기
        </button>
      </div>
    </div>
  );
};

export default VoteModal;
