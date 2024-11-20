// src/components/ParticipantScreen/ParticipantScreen.jsx

import React, { useState } from 'react';
import VideoChat from '../../VideoChat/VideoChat';
import './ParticipantScreen.css';

const ParticipantScreen = ({ roomName, role }) => {
  const [imageUrl, setImageUrl] = useState(null); // 이미지 URL을 저장할 상태

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    // 이미지 파일인지 확인
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file); // 파일의 URL 생성
      setImageUrl(url);
    } else {
      alert('이미지 파일만 업로드할 수 있습니다.');
    }
  };

  return (
    <div className="participant-screen">
      {imageUrl ? (
        <div className="image-preview">
          {/* 업로드한 이미지 미리보기 */}
          <img src={imageUrl} alt="Uploaded Preview" className="media-preview" />
        </div>
      ) : (
        <div>
          <p>상대방의 송출화면</p>
          <VideoChat roomName={roomName} role={role} />
        </div>
      )}

      {/* 파일 업로드 input (주석 처리됨) */}
      {/* 
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="file-input"
      />
      */}
    </div>
  );
};

export default ParticipantScreen;
