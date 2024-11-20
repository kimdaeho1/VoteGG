import React, { useState } from 'react';
import AlarmModal from './AlarmModal'; // 모달 컴포넌트 가져오기
import './AlarmButton.css';

const AlarmButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="alarm-button-container">
      <button className="alarm-button" onClick={handleOpenModal}>
      <img
          src="/bell2.png" // 이미지 경로
          alt="알람 버튼"
          className="alarm-icon"
        />
      </button>
      {isModalOpen && <AlarmModal onClose={handleCloseModal} />}
    </div>
  );
};

export default AlarmButton;
