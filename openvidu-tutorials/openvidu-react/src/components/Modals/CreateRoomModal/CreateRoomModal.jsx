import React, { useState } from 'react';
import './CreateRoomModal.css';
import { useNavigate } from "react-router-dom"; // 리다이렉트를 위한 useNavigate 사용
import axios from "axios"; // POST 요청을 위한 axios

const CreateRoomModal = ({ onClose, onCreateRoom }) => {
  const [roomTitle, setRoomTitle] = useState('');
  const [invitees, setInvitees] = useState(['', '', '']); // 초대할 사람 3명
  const handleInviteeChange = (index, value) => {
    const updatedInvitees = [...invitees];
    updatedInvitees[index] = value;
    setInvitees(updatedInvitees);
  };
  const navigate = useNavigate(); // useNavigate 훅 초기화

  // 토큰에서 사용자 이름 추출
  const token = localStorage.getItem("token");
  console.log(token);
  const username = token ? getUsernameFromToken(token) : "Unknown User";

  const handleCreateRoom = async () => {
    try {
      // 초대할 사람 중 비어있는 입력 필드는 제외 (초대기능)
      const filteredInvitees = invitees.filter((invitee) => invitee.trim() !== '');


      // 서버로 POST 요청 보내기
      const response = await axios.post(window.location.origin + "/api/room/roomCreate", {
        roomname: roomTitle,
        createdby: username, // 임의 사용자 ID, 필요에 따라 수정
        invitees: filteredInvitees, // 초대할 사람 정보 추가 (초대기능)
      });

      if (response.status === 201) {
        const { roomNumber } = response.data; // 서버 응답에서 roomNumber 가져오기
        console.log("방 생성 성공, 방 번호:", roomNumber);

        // 방 번호를 기반으로 페이지 이동
        navigate(`/room/${roomNumber}`);
        onClose();
      }
    } catch (error) {
      console.error("방 생성 실패:", error.message);
      console.log(roomNumber);
      alert("방 생성에 실패했습니다. 다시 시도해주세요.");
    }
  };
  return (
    <div className="room-modal-overlay" onClick={onClose}>
      <div className="room-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>방 만들기</h2>
        {/* 방 제목 입력 */}
        <label className="input-label">방 제목</label>
        <input
          type="text"
          value={roomTitle}
          onChange={(e) => setRoomTitle(e.target.value)}
          className="modal-input"
          placeholder="방 제목을 입력하세요"
        />
        {/* 초대할 사람 입력 */}
        {invitees.map((invitee, index) => (
          <div key={index}>
            <label className="input-label">{`초대할 사람 ${index + 1}`}</label>
            <input
              type="text"
              value={invitee}
              onChange={(e) => handleInviteeChange(index, e.target.value)}
              className="modal-input"
              placeholder={`초대할 사람 ${index + 1} 닉네임`}
            />
          </div>
        ))}
        {/* 버튼들 */}
        <div className="modal-buttons">
          <button className="modal-create-button" onClick={handleCreateRoom}>
            방 생성하기
          </button>
          <button className="modal-cancel-button" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
};
export default CreateRoomModal;




// Utility Function for Token Decoding
const getUsernameFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // JWT payload parsing
    return payload.username; // Extract username
  } catch (error) {1
    console.error('Failed to parse token:', error);
    return 'Unknown User';
  }
};