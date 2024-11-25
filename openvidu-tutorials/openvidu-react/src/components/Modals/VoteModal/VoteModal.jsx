import React from "react";
import "./VoteModal.css";

const VoteModal = ({ toggleModal }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <button onClick={toggleModal} className="close-button">X</button>
        <h3>빈 모달창</h3>
        {/* 나중에 모달 내에서 추가할 내용들 */}
      </div>
    </div>
  );
};

export default VoteModal;
