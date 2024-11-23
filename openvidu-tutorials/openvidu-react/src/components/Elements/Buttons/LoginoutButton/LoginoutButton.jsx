import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginoutModal from '../../../Modals/LoginoutModal/LoginoutModal'
import './LoginoutButton.css'

const LoginoutButton = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const username = token ? getUsernameFromToken(token) : "";

  const openModal = () => {
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("로그아웃 되었습니다.");
    setIsModalOpen(false);
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/login');
  }

  return (
    token ?
      (
        <>
          <button type="button" onClick={openModal} className="logout-button">
            {username} 님
          </button >
          {
            isModalOpen && (
              <LoginoutModal
                username={username}
                handleLogout={handleLogout}
                closeModal={closeModal}
              />
            )
          }
        </>
      ) : (
        <button type="button" onClick={handleLoginClick} className="login-button">
          Login
        </button >
      )
  )
}

export default LoginoutButton;

const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // JWT payload parsing
    return payload.username; // Extract username
  } catch (error) {
    console.error('Failed to parse token:', error);
    return 'Unknown User';
  }
}