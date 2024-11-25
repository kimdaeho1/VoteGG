import React, { useState } from "react";
import "./VoteModal.css";

const VoteModal = ({ toggleModal, voteCount }) => {
  const [currentVote, setCurrentVote] = useState(0); // 현재 투표값 상태 관리

  // 투표권을 소모할 때 호출되는 함수
  const handleVote = () => {
    if (currentVote > 0) {
      // 투표권을 소모하는 로직을 추가
      console.log(`투표! ${currentVote} 투표권 사용`);
      // TODO: 서버에 투표권 소모 요청 추가 (서버와 연동)
      toggleModal(); // 모달 닫기
    } else {
      alert("투표권이 부족합니다.");
    }
  };

  const handleSliderChange = (event) => {
    setCurrentVote(event.target.value); // 슬라이더 값 업데이트
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <button onClick={toggleModal} className="close-button">X</button>
        <h3>투표</h3>
        <p>현재 투표권: {voteCount}</p>

        {/* 범위 입력 추가 */}
        <label htmlFor="voteRange">투표권 소모:</label>
        <input
          type="range"
          id="voteRange"
          className="form-range"
          min="0"
          max={voteCount} // 현재 투표권 수에 따라 max 값 설정
          value={currentVote}
          onChange={handleSliderChange}
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
