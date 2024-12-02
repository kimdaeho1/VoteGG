import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginoutModal from '../../../Modals/LoginoutModal/LoginoutModal'
import './LoginoutButton.css'
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
      // Check if Kakao SDK is initialized and logout using REST API
      if (window.Kakao && window.Kakao.isInitialized()) {
        const accessToken = window.Kakao.Auth.getAccessToken();
        if (!accessToken) {
          console.warn("유효한 액세스 토큰이 없습니다. 이미 로그아웃되었을 수 있습니다.");
          cleanupAfterLogout();
          addToast("이미 로그아웃된 상태입니다.", "error");
          return;
        }

        const response = await fetch('https://kapi.kakao.com/v1/user/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`, // Pass access token
          },
        });

        if (response.ok) {
          console.log("카카오 REST API 로그아웃 성공");
          window.Kakao.Auth.setAccessToken(null); // Reset Kakao SDK session
          cleanupAfterLogout();
          addToast("로그아웃 되었습니다.", "error");
        } else {
          const errorData = await response.json();
          console.error("카카오 REST API 로그아웃 실패:", errorData);
          throw new Error("카카오 REST API 로그아웃 실패");
        }
      } else {
        throw new Error("Kakao SDK가 초기화되지 않았습니다.");
      }
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

    addToast("로그아웃 되었습니다.", "success");

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
        <button type="button" onClick={openModal} className="logout-button">
          {username} 님
        </button>
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
      </button>
    )
  );
};

export default LoginoutButton;

// Function to extract username from JWT token
const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
    return payload.username; // Extract username from payload
  } catch (error) {
    console.error('Failed to parse token:', error);
    return 'Unknown User';
  }
};
