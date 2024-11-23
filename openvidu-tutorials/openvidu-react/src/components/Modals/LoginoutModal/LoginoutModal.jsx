import React from 'react';
import './LoginoutModal.css';

const LoginoutModal = ({ username, handleLogout, closeModal }) => {
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{username} 님</h2>
        <p>로그아웃 하시겠습니까?</p>
        <div className="modal-buttons">
          <button onClick={handleLogout} className="modal-logout-button">
            로그아웃
          </button>
          <button onClick={closeModal} className="cancel-button">
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginoutModal;
