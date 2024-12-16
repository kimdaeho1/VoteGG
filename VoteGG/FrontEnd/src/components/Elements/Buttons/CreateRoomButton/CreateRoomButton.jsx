import React, { useState } from 'react';
import './CreateRoomButton.css';
import RoomModal from '../../../Modals/CreateRoomModal/CreateRoomModal';
import { useNavigate } from "react-router-dom";
import { useToast } from '../../Toast/ToastContext';

const CreateRoomButton = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = () => setIsModalOpen(false);
  const { addToast } = useToast();
  
  const openModal = () => {
  if (token){
   setIsModalOpen(true)
  }else{
    addToast("로그인해주세요.", "error");
    navigate('/login');
  }}

  return (
    <div className="create-room-container">
      <button className="create-room-button" onClick={openModal}>
        <img
          src="/debatelast.png" // PNG 파일 경로
          alt="Create Room"
          className="create-room-icon"
        />
        <div className="create-text">토론하기</div>
      </button>
      {isModalOpen && <RoomModal onClose={closeModal} />}
    </div>
  );
};
export default CreateRoomButton;