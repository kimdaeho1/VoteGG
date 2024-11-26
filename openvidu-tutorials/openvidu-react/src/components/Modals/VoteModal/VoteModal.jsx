import React, { useState, useEffect } from "react";
import axios from "axios";
import "./VoteModal.css";

const VoteModal = ({ toggleModal, voteCount, roomNumber }) => {
  const [currentVote, setCurrentVote] = useState(0);
  const [participants, setParticipants] = useState([]);

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

  const handleVote = () => {
    if (currentVote > 0) {
      console.log(`Voted! Used ${currentVote} votes.`);
      toggleModal();
    } else {
      alert("You don't have enough votes.");
    }
  };

  const handleSliderChange = (event) => {
    setCurrentVote(event.target.value);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <button onClick={toggleModal} className="close-button">
          X
        </button>
        <h3>투표</h3>
        <p>현재 투표권: {voteCount}</p>
        <h4>참가자 목록</h4>
        <div className="participant-list">
          {participants.length > 0 ? (
            participants.map(([participantId, votes], index) => (
              <div key={index} className="participant-item">
                {participantId} (투표 수: {votes})
              </div>
            ))
          ) : (
            <p>참가자가 없습니다.</p>
          )}
        </div>
        <label htmlFor="voteRange">투표권 소모:</label>
        <input
          type="range"
          id="voteRange"
          className="form-range"
          min="0"
          max={voteCount}
          value={currentVote}
          onChange={handleSliderChange}
        />
        <p>{currentVote} 투표권 사용</p>
        <button onClick={handleVote} className="vote-button">
          투표하기
        </button>
      </div>
    </div>
  );
};

export default VoteModal;
