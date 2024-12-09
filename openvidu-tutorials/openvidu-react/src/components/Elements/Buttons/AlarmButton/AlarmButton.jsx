import React, { useState, useEffect, useRef } from 'react';
import AlarmModal from '../../../Modals/AlarmModal/AlarmModal'; // 모달 컴포넌트 가져오기
import './AlarmButton.css';
import axios from 'axios';
import { useToast } from '../../Toast/ToastContext';
import jwtDecode from 'jwt-decode'; // jwt-decode 라이브러리 임포트

const AlarmButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasNewData, setHasNewData] = useState(false); // 새 데이터 여부 상태
  const previousDataLengthRef = useRef(0); // 이전 초대 데이터 길이
  const [isPolling, setIsPolling] = useState(true); // 폴링 활성화 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 확인
  const token = localStorage.getItem('token');
  const { addToast } = useToast();

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setHasNewData(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const startLongPolling = async () => {
    while (isPolling) {
      try {
        const username = token ? getUsernameFromToken(token) : '';
        if (!username) {
          //console.warn("Username is empty or invalid. Stopping polling.");
          setIsPolling(false); // 폴링 중단
          break;
        }

        const response = await axios.get(`${window.location.origin}/api/invitation/invitations/${username}`, {
          timeout: 30000, // 30초 동안 대기
        });

        const currentDataLength = response.data.length;
        const previousDataLength = previousDataLengthRef.current;

        if (currentDataLength > 0 && currentDataLength !== previousDataLength) {
          setHasNewData(true);
          addToast("초대가 있습니다!", "success");
          previousDataLengthRef.current = currentDataLength;
        } else if (currentDataLength === 0) {
          setHasNewData(false);
          previousDataLengthRef.current = 0;
        }
      } catch (error) {
        if (error.code !== 'ECONNABORTED') {
          console.error('Error during long polling:', error);
        }
      }
    }
  };

  useEffect(() => {
    // 로그인 상태 확인
    const checkLoginStatus = () => {
      if (token) {
        const username = getUsernameFromToken(token);
        if (username && username !== 'Unknown User') {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();

    if (isLoggedIn) {
      setIsPolling(true);
      startLongPolling();
    }

    return () => {
      setIsPolling(false); // 컴포넌트 언마운트 시 폴링 중지
    };
  }, [token, isLoggedIn]);

  return (
    <div className="alarm-button-container">
      <button className="alarm-button" onClick={handleOpenModal}>
        <img
          src={hasNewData ? "/hatch.png" : "/alarmegg.png"} // 알람 상태에 따라 이미지 변경
          alt="알람 버튼"
          className="alarm-icon"
        />
        {hasNewData && <div className="notification-dot"></div>}
        <div className="alarm-text">메일함</div>
      </button>
      {isModalOpen && <AlarmModal onClose={handleCloseModal} />}
    </div>
  );
};

// Function to extract username from JWT token
// Utility Function for Token Decoding
const getUsernameFromToken = (token) => {
  try {
    const decoded = jwtDecode(token); // JWT 디코딩
    return decoded.username || 'Unknown User'; // username 반환, 없을 시 기본값
  } catch (error) {
    console.error('Failed to decode token:', error);
    return 'Unknown User';
  }
};


export default AlarmButton;
