import React, { useEffect, useState } from 'react';
import './AlarmModal.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../Elements/Toast/ToastContext';

const AlarmModal = ({ onClose, username }) => {
  const [invitations, setInvitations] = useState([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate(); // useNavigate 훅 사용
  const { addToast } = useToast();

  // 초대 목록 가져오기
  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const username = token ? getUsernameFromToken(token) : "";
        const response = await axios.get(`${window.location.origin}/api/invitation/invitations/${username}`);
        setInvitations(response.data);
      } catch (error) {
        console.error('초대 목록 가져오기 실패:', error);
      }
    };

    fetchInvitations();
  }, [username]);

  // 초대 응답 처리
  const respondToInvitation = async (id, response, roomId) => {
    try {
      const res = await axios.post(`${window.location.origin}/api/invitation/invitations/respond`, { id, response });
      console.log('응답 성공:', res.data);

      if (response === 'accepted') {
        navigate(`/room/${roomId}`); // roomId로 페이지 이동
        addToast("토론방에 입장했습니다.", "success");
      } else {
        setInvitations((prev) => prev.filter((invite) => invite._id !== id)); // 초대 목록에서 제거
        addToast("초대를 거절했습니다.", "error");
      }
      onClose();
    } catch (error) {
      console.error('응답 실패:', error);
    }
  };

  return (
    <div className="alarm-modal">
      <div className="alarm-modal-content">
        <h2>알림</h2>
        {invitations.length > 0 ? (
          <div>
            {invitations.map((invite) => (
              <div key={invite.id} className="invitation-item">
                <p>
                  <strong>{invite.inviter}</strong>님이 초대했습니다!
                </p>
                <button
                  className="accept-button"
                  onClick={() => respondToInvitation(invite._id, 'accepted')}
                >
                  ✔ 수락
                </button>
                <button
                  className="decline-button"
                  onClick={() => respondToInvitation(invite._id, 'declined')}
                >
                  ✖ 거절
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>새로운 초대가 없습니다.</p>
        )}
        <button className="close-alarm-button" onClick={onClose}>
          닫기
        </button>
      </div>
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

export default AlarmModal;
