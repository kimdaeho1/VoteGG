import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { updateMemberCount } from "../../roomSlice";
import "./RoomList.css";

const RoomList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // useState로 DB에서 가져온 방 데이터 관리
  const [rooms, setRooms] = useState([
    {
      id: '1', roomTitle: '토론방 1', creator: 'user1', memberCount: 5,
      image: '/1.png',
    },
    {
      id: '2', roomTitle: '토론방 2', creator: 'user2', memberCount: 8,
      image: '/2.jpg',
    },
    {
      id: '3', roomTitle: '토론방 3', creator: 'user3', memberCount: 3,
      image: '/3.jpeg',
    },
    {
      id: '4', roomTitle: '토론방 4', creator: 'user1', memberCount: 6,
      image: '/4.png',
    },
    {
      id: '5', roomTitle: '토론방 5', creator: 'user2', memberCount: 7,
      image: '/1.png',
    },
    {
      id: '6', roomTitle: '토론방 6', creator: 'user3', memberCount: 2,
      image: '/1.png',
    },
    {
      id: '7', roomTitle: '토론방 7', creator: 'user1', memberCount: 9,
      image: '/1.png',
    },
    {
      id: '8', roomTitle: '토론방 8', creator: 'user2', memberCount: 4,
      image: '/1.png',
    },
    {
      id: '9', roomTitle: '토론방 9', creator: 'user3', memberCount: 5,
      image: '/1.png',
    },
  ]);

// 데이터베이스에서 방 정보 가져오기
useEffect(() => {
  const fetchRooms = async () => {
    try {
      const response = await axios.get("https://recordstudio.site:8443/api/room/roomList");
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
            {/* <div className="room-buttons">
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
              </div> */}
          </div>
        </div>
      ))}
    </div>
  </div>
);
};

export default RoomList;
