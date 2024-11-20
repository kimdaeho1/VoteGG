import React, { useState } from 'react';
import './CreateRoomButton.css';
import RoomModal from './RoomModal';
const CreateRoomButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  return (
    <div className="create-room-container">
      <button className="create-room-button" onClick={openModal}>
        <img
          src="/live2.png" // PNG 파일 경로
          alt="Create Room"
          className="create-room-icon"
        />
      </button>
      {isModalOpen && <RoomModal onClose={closeModal} />}
    </div>
  );
};
export default CreateRoomButton;