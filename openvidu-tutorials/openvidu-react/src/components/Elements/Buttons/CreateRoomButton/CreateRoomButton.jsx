import React, { useState } from 'react';
import './CreateRoomButton.css';
import RoomModal from '../../../Modals/CreateRoomModal/CreateRoomModal';
import { useNavigate } from "react-router-dom";

const CreateRoomButton = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);
  
  const openModal = () => {
  if (token){
   setIsModalOpen(true)
  }else{
    alert("로그인해주세요.");
    navigate('/login');
  }}

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