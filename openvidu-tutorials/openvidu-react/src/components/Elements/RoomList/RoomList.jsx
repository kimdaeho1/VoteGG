import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { updateMemberCount } from "../../../roomSlice";
import OpenviduFinal from '../openvidu/OpenviduFinal';
import "./RoomList.css";

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const RoomList = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [thumbnails, setThumbnails] = useState({}); // 방 번호별 썸네일 저장

  // 데이터베이스에서 방 정보 가져오기
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get(window.location.origin + '/api/room/roomList');
        setRooms(response.data); // 서버에서 받은 데이터로 상태 업데이트

      } catch (error) {
        console.error("방 목록 가져오기 실패:", error.message);
      }
    };

    fetchRooms();
  }, []);




  return (
    <div className="room-list-container">
      <div className="room-list-header">
        <h1 className="room-list-title">LIVE 토론</h1>
      </div>
      <div className="room-list">
        {rooms.map((room) => (
          <div key={room.roomNumber} className="room-card">
            <div className="room-image">
              <img
                // src={room.image || "/default-image.png"}
                src='./sample.jpeg'
                alt={`${room.roomname} 이미지`}
                onClick={() => navigate(`/observer/${room.roomNumber}`)}
                className='entry-room' />
              <p className="room-member-count">{room.memberCount}명</p>
              <p className="room-live">LIVE</p>
            </div>
            <div className="room-details">
              <h2 className="room-name">{room.roomname}</h2>
              <div className="room-info">
                <p className="room-creator">{room.createdby} 님</p>
              </div>
              <div className="room-buttons">
                <button
                  className="room-spectate-button"
                  onClick={() => navigate(`/observer/${room.roomNumber}`)}
                >
                  참관하기
                </button>
                <button
                  className="room-discuss-button"
                  onClick={() => navigate(`/room/${room.roomNumber}`)}
                >
                  토론하기
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomList;
