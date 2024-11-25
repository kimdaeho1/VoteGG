import React from "react";
import "./VoteModal.css";

const VoteModal = ({ toggleModal, voteCount }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <button onClick={toggleModal} className="close-button">X</button>
        <h3>빈 모달창</h3>
        <p>현재 투표권: {voteCount}</p> {/* 투표권을 모달에서 표시 */}
        {/* 나중에 모달 내에서 추가할 내용들 */}
      </div>
    </div>
  );
};

export default VoteModal;
