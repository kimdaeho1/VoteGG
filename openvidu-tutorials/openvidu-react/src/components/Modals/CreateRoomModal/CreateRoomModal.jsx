import React, { useState, useEffect, useRef } from 'react';
import './CreateRoomModal.css';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Tagify from "@yaireo/tagify"; // Tagify 라이브러리 가져오기
import "@yaireo/tagify/dist/tagify.css"; // Tagify 스타일 가져오기
import { useToast } from '../../Elements/Toast/ToastContext';
import jwtDecode from 'jwt-decode'; // jwt-decode 라이브러리 임포트

const CreateRoomModal = ({ onClose }) => {
  const [roomTitle, setRoomTitle] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [tags, setTags] = useState([]); // 태그 상태
  const tagifyRef = useRef(null); // Tagify 인스턴스를 참조

  const navigate = useNavigate();

  const { addToast } = useToast();

  // 썸네일 변경 핸들러
  const handleThumbnailChange = (e) => {
    setThumbnail(e.target.files[0]);
  };

  // 태그 입력 상태 업데이트
  const handleTagChange = (e) => {
    setTags(e.detail.value); // Tagify에서 반환된 JSON 태그 리스트
  };

  const handleCreateRoom = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        addToast("로그인이 필요합니다.", "error");
        return;
      }
  
      const formData = new FormData();
      formData.append("roomname", roomTitle);
      formData.append("createdby", getUsernameFromToken(token));
  
      // 썸네일 처리
      if (thumbnail != null) {
        formData.append("thumbnail", thumbnail);
      } else {
        // 기본 이미지를 fetch로 가져오기
        const response = await fetch("/debate_ex.png");
        if (!response.ok) {
          throw new Error("기본 이미지를 불러올 수 없습니다.");
        }
        const blob = await response.blob();
        const defaultImage = new File([blob], "debate_ex.png", { type: blob.type });
        formData.append("thumbnail", defaultImage);
      }
  
      // 태그 처리
      let parsedTags = [];
      try {
        parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch (error) {
        console.error("태그 파싱 오류:", error.message);
        parsedTags = [];
      }
  
      const tagValues = Array.isArray(parsedTags) ? parsedTags.map(tag => tag.value) : [];
      formData.append("tags", JSON.stringify(tagValues));
  
      // 디버깅: FormData 출력
      //console.log("FormData entries:");
      for (let [key, value] of formData.entries()) {
        //console.log(key, value);
      }
  
      // 서버로 POST 요청
      const response = await axios.post(
        `${window.location.origin}/api/room/roomCreate`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      if (response.status === 201) {
        const { roomNumber } = response.data;
        //console.log("방 생성 성공, 방 번호:", roomNumber);
        navigate(`/room/${roomNumber}`);
        onClose();
      }
    } catch (error) {
      console.error("방 생성 실패:", error.message);
      addToast("방 생성에 실패했습니다. 다시 시도해주세요.", "error");
    }
  };
  
  

  useEffect(() => {
    // Tagify 초기화 (드랍다운 제거)
    const input = document.querySelector("input[name='tags']");
    tagifyRef.current = new Tagify(input, {
      enforceWhitelist: false, // 자동완성 강제 비활성화
      dropdown: {
        enabled: false, // 드랍다운 메뉴 완전히 비활성화
      },
    });

    // 태그 입력 상태 업데이트 이벤트 연결
    tagifyRef.current.on("change", handleTagChange);

    return () => {
      tagifyRef.current.destroy(); // 컴포넌트가 언마운트되면 Tagify 제거
    };
  }, []);

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
        {/* 썸네일 업로드 */}
        <label className="input-label">썸네일 이미지</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleThumbnailChange}
          className="modal-input"
        />
        {/* 태그 입력 */}
        <label className="input-label">태그</label>
        <input
          name="tags"
          placeholder="태그를 입력하세요 (Enter로 구분)"
          className="modal-input"
        />
        {/* 버튼들 */}
        <div className="modal-buttons">
          <button className="modal-create-button" onClick={handleCreateRoom}>
            생성
          </button>
          <button className="modal-cancel-button" onClick={onClose}>
            닫기
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
    const decoded = jwtDecode(token); // JWT 디코딩
    return decoded.username || 'Unknown User'; // username 반환, 없을 시 기본값
  } catch (error) {
    console.error('Failed to decode token:', error);
    return 'Unknown User';
  }
};

