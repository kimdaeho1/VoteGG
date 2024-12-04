import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // axios 가져오기
import { SearchContext } from "../../../stores/SearchContext"; // Context import
import { useToast } from "../Toast/ToastContext";
import './Live.css';

const Live = () => {
  const navigate = useNavigate();
  const [topRoom, setTopRoom] = useState(null); // 가장 높은 memberCount를 가진 방 하나만 저장
  const { addToast } = useToast();

  // 데이터베이스에서 방 정보 가져오기
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get(
          `${window.location.origin}/api/room/roomList`
        );
        // memberCount가 가장 높은 방 찾기
        const rooms = response.data;
        if (rooms && rooms.length > 0) {
          const highestMemberCountRoom = rooms.reduce((prev, current) =>
            prev.memberCount > current.memberCount ? prev : current
          );
          setTopRoom(highestMemberCountRoom);
        }
      } catch (error) {
        console.error("방 목록 가져오기 실패:", error.message);
      }
    };

    fetchRooms();
  }, []);

  if (!topRoom) {
    return <div>Loading...</div>; // 로딩 중 메시지
  }

  return (
    <div className="live-container">
      <div
        className="live"
        onClick={() => navigate(`/observer/${topRoom.roomNumber}`)}
      >
        <div className="live-image-container">
          <img
            src={topRoom.thumbnail ? `${topRoom.thumbnail}` : "./poultry.jpg"}
            alt="Live Agora Thumbnail"
            className="entry-room1"
          />
          <div className="gradient-overlay"></div>
        </div>
        <div className="live-text">
          <div className="live-count">
            <img
              src="/liveIcon.png" // 이미지 경로
              alt="Live Agora"
              className="live-icon"
            />
            <p>{topRoom.memberCount} 명</p>
          </div>
          <h1>{topRoom.roomname || "Untitled Room"}</h1> {/* 방 제목이 없을 경우 기본값 설정 */}
          <p>Join discussions and connect with others.</p>
        </div>
      </div>
    </div>
  );
};

export default Live;
