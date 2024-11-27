import React, { useState, useEffect } from "react";
import axios from "axios";
import { getVoteCount, useVoteCount } from "../../../votecount.js"; // voteCount.js에서 가져오기
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
    // 로컬스토리지에서 가져온 값을 기반으로 remainingVoteCount를 계산하여 상태 업데이트
    setRemainingVoteCount(maxVoteCount - usedVoteCount);
  }, [maxVoteCount, usedVoteCount]); // maxVoteCount나 usedVoteCount가 변경될 때마다 업데이트

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

    if (currentVote <= 0 || currentVote > remainingVoteCount) {
      alert("남은 투표권을 초과할 수 없습니다.");
      return;
    }

    // 투표권 사용
    const voteSuccess = useVoteCount(roomNumber, userId, currentVote);

    if (voteSuccess) {
      try {
        await axios.post("/api/room/vote", {
          roomNumber,
          participant: selectedParticipant,
          votes: parseInt(currentVote, 10), // parseInt로 정수로 변환
        });

        alert(`${selectedParticipant}님에게 ${currentVote} 투표 완료!`);
        toggleModal(); // 모달 닫기

        // 투표 후 투표권을 새로 가져오기
        const updatedVoteCount = getVoteCount(roomNumber, userId);
        setRemainingVoteCount(updatedVoteCount.maxVoteCount - updatedVoteCount.usedVoteCount); // 업데이트된 투표권 상태 반영
      } catch (error) {
        console.error("투표 실패:", error.message);
        alert("투표 중 오류가 발생했습니다.");
      }
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
          onChange={(e) => setCurrentVote(Number(e.target.value))} // 숫자로 변환
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
