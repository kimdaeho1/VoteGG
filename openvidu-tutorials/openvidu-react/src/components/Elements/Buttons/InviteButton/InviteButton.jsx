import React, { useState } from 'react';
import AlarmModal from '../../../Modals/InviteModal/InviteModal'; // 모달 컴포넌트 가져오기
import './InviteButton.css';

const InviteButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="Invite-button-container">
      <button className="Invite-button" onClick={handleOpenModal}>
      <img
          src="/resources/images/egg.png" // 이미지 경로
          alt="초대 버튼"
          className="Invite-icon"
        />
      </button>
      {isModalOpen && <AlarmModal onClose={handleCloseModal} />}
    </div>
  );
};

export default InviteButton;
