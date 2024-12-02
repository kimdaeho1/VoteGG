import React, { useState, useEffect, useRef } from 'react';
import AlarmModal from '../../../Modals/AlarmModal/AlarmModal'; // 모달 컴포넌트 가져오기
import './AlarmButton.css';
import axios from 'axios';
import { useToast } from '../../Toast/ToastContext';

const AlarmButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasNewData, setHasNewData] = useState(false); // 새 데이터 여부 상태
  const dataRef = useRef([]);
  const [data, setData] = useState([]); // 데이터 상태
  const token = localStorage.getItem('token');
  const { addToast } = useToast();

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setHasNewData(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const fetchData = async () => {
    try {
      const username = token ? getUsernameFromToken(token) : '';
      const response = await axios.get(`${window.location.origin}/api/invitation/invitations/${username}`);
      console.log('Fetched invitations:', response.data);

      if (response.data.length > 0) {
        setHasNewData(true); // 초대가 존재하면 알림 활성화
        addToast("초대가 있습니다!", "success");
      } else {
        setHasNewData(false); // 초대가 없으면 알림 비활성화
      }

      setData(response.data); // 초대 데이터 업데이트
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData(); // 초기 데이터 가져오기
    const interval = setInterval(fetchData, 5000); // 5초마다 초대 확인
    return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
  }, [token]); // `token`에 의존

  return (
    <div className="alarm-button-container">
      <button className="alarm-button" onClick={handleOpenModal}>
      <img
          src="/bell2.png" // 이미지 경로
          alt="알람 버튼"
          className="alarm-icon"
        />
        {hasNewData && <div className="notification-dot"></div>}
      </button>
      {isModalOpen && <AlarmModal onClose={handleCloseModal} />}
    </div>
  );
};

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


export default AlarmButton;
