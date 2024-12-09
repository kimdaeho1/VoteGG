import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode'; // jwt_decode 라이브러리 추가
import LoginoutModal from '../../../Modals/LoginoutModal/LoginoutModal';
import CreateRoomButton from '../CreateRoomButton/CreateRoomButton';
import AlarmButton from '../AlarmButton/AlarmButton';
import InviteButton from '../InviteButton/InviteButton';
import './LoginoutButton.css';
import { useToast } from '../../Toast/ToastContext';

const LoginoutButton = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  // Extract username from the token
  const username = token ? getUsernameFromToken(token) : "";

  // Open logout confirmation modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Close logout confirmation modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      // Check if Kakao SDK is initialized
      if (window.Kakao && window.Kakao.isInitialized()) {
        const accessToken = window.Kakao.Auth.getAccessToken();

        if (accessToken) {
          const response = await fetch('https://kapi.kakao.com/v1/user/logout', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`, // Pass access token
            },
          });

          if (response.ok) {
            window.Kakao.Auth.setAccessToken(null); // Reset Kakao SDK session
          } else {
            console.error("카카오 REST API 로그아웃 실패:", await response.json());
            throw new Error("카카오 REST API 로그아웃 실패");
          }
        }
      }

      // Cleanup after logout
      cleanupAfterLogout();
      addToast("로그아웃 되었습니다.", "success");
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      addToast("로그아웃 중 문제가 발생했습니다. 관리자에게 문의하세요.", "error");
    }
  };

  // Cleanup after logout
  const cleanupAfterLogout = () => {
    // Remove tokens from local storage and cookies
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "access_token=; path=/; domain=recordstudio.site; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.dispatchEvent(new CustomEvent("userStatusChanged")); // 이벤트 발생

    // Redirect to the home page
    setIsModalOpen(false);
    navigate('/');
  };

  // Navigate to login page
  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    token ? (
      <>
        <AlarmButton />
        <InviteButton />
        <CreateRoomButton />
        <div className='logout-container'>
          <button type="button" onClick={openModal} className="logout-button">
            <div>{username} 님</div>
            <div className="logout-text">로그아웃</div>
          </button>
        </div>
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
      <div className='login-button-container'>
        <div className="login-text">로그인후 이용해주세요!</div>
        <button type="button" onClick={handleLoginClick} className="login-button">
          Login
        </button>
      </div>
    )
  );
};

export default LoginoutButton;

// Function to extract username from JWT token
const getUsernameFromToken = (token) => {
  try {
    const payload = jwt_decode(token); // jwt_decode로 디코딩
    return payload.username; // Extract username from payload
  } catch (error) {
    console.error('Failed to decode token:', error);
    return 'Unknown User';
  }
};
