import React, { useState } from 'react';
import './InviteModal.css';
import axios from 'axios';
import { useToast } from '../../Elements/Toast/ToastContext';
import jwtDecode from 'jwt-decode'; // jwt-decode 라이브러리 임포트
// 기존 코드
const InviteModal = ({ onClose }) => {
    const [invitee, setInvitee] = useState('');
    const roomId = window.location.href.split('/room/')[1];
    const token = localStorage.getItem('token');
    const { addToast } = useToast();

    const handleInvite = async () => {
        try {
        const username = token ? getUsernameFromToken(token) : "";

        if (username === invitee) {
            addToast("자기 자신은 초대할 수 없습니다.", "error");
            return; // 요청 중단
        }
        
        const response = await axios.post(`${window.location.origin}/api/invitation/invite`, {
            inviter: username,
            invitee,
            roomId,
        });
        //console.log('초대 성공:', response.data);
        addToast("초대 성공", "success");
        onClose();
        } catch (error) {
        console.error('초대 실패:', error);
        addToast("초대 실패", "success");
        }
    };

    
    return (
        <div className="invite-modal">
            <div className="invite-modal-content">
                <h2>초대하기</h2>
                <input
                    type="text"
                    placeholder="User Name"
                    value={invitee}
                    onChange={(e) => setInvitee(e.target.value)}
                    className="invite-input"
                />
                <div className="button-group">
                    <button className="accept-invite-button" onClick={handleInvite}>
                        초대
                    </button>
                    <button className="close-invite-button" onClick={onClose}>
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

const getUsernameFromToken = (token) => {
    try {
      const decoded = jwtDecode(token); // JWT 디코딩
      return decoded.username || 'Unknown User'; // username 반환, 없을 시 기본값
    } catch (error) {
      console.error('Failed to decode token:', error);
      return 'Unknown User';
    }
  };

export default InviteModal;
