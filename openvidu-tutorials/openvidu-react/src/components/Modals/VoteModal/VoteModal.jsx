import React, { useState, useEffect } from "react";
import axios from "axios";
import "./VoteModal.css";

const VoteModal = ({ toggleModal, voteCount, roomNumber }) => {
  const [currentVote, setCurrentVote] = useState(0); // 현재 투표권
  const [participants, setParticipants] = useState([]); // 참가자 목록
  const [selectedParticipant, setSelectedParticipant] = useState(""); // 선택된 참가자

  // 참가자 목록 가져오기
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
  const handleVote = async () => {
    if (!selectedParticipant) {
      alert("투표할 참가자를 선택해주세요.");
      return;
    }

    if (currentVote <= 0) {
      alert("투표권은 최소 1 이상이어야 합니다.");
      return;
    }

    try {
      await axios.post("/api/room/vote", {
        roomNumber,
        participant: selectedParticipant,
        votes: parseInt(currentVote, 10),
      });

      alert(`${selectedParticipant}님에게 ${currentVote} 투표 완료!`);
      toggleModal(); // 모달 닫기
    } catch (error) {
      console.error("투표 실패:", error.message);
      alert("투표 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <button onClick={toggleModal} className="close-button">
          X
        </button>
        <h3>투표</h3>
        <p>현재 투표권: {voteCount}</p>

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
          max={voteCount}
          value={currentVote}
          onChange={(e) => setCurrentVote(e.target.value)}
        />
        <p>{currentVote} 투표권 사용</p>

        {/* 투표 버튼 */}
        <button onClick={handleVote} className="vote-button">
          투표하기
        </button>
      </div>
    </div>
  );
};

export default VoteModal;
