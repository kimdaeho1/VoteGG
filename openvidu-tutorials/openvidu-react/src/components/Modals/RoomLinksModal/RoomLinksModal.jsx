import React from 'react';
import { Link } from 'react-router-dom';
import './RoomLinksModal.css';

const RoomLinksModal = ({ room, onClose }) => {
  if (!room) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{room.name}</h2>
        <ul>
          <li key={`${room.roomNumber}-participant`}>
            <Link to={`/room/${room.roomNumber}`} onClick={onClose}>
              참여하기
            </Link>
          </li>
          <li key={`${room.roomNumber}-observer`}>
            <Link to={`/observer/${room.roomNumber}`} onClick={onClose}>
              관전하기
            </Link>
          </li>
        </ul>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

export default RoomLinksModal;
