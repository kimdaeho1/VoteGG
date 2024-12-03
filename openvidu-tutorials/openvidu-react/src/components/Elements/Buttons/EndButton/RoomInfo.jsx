import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./RoomInfo.css";

const RoomInfo = () => {
  const { roomNumber } = useParams(); // URL에서 방 번호 가져오기
  const [roomData, setRoomData] = useState({
    roomname: "",
    memberCount: 0,
    createdby: "",
    creatorProfileImage: "/default-profile.png", // 기본 프로필 이미지
    tags: [],
  });

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`/api/room/rooms/${roomNumber}`);
        if (!response.ok) {
          throw new Error("방 정보를 가져오는 데 실패했습니다.");
        }
        const data = await response.json();
        setRoomData(data);
      } catch (error) {
        console.error("방 정보 가져오기 오류:", error);
        setRoomData({
          roomname: "Unknown Room",
          memberCount: 9999,
          createdby: "Unknown Creator",
          creatorProfileImage: "/default-profile.png",
          tags: [],
        });
      }
    };

    fetchRoomData();
  }, [roomNumber]);

  return (
    <div className="room-naming">
      {/* 프로필 이미지와 LIVE 태그 추가 */}
      <div className="room-info__profile">
        <img
          src={roomData.creatorProfileImage} // 백엔드에서 받은 프로필 이미지 URL 사용
          alt={`${roomData.createdby}의 프로필`}
          className="room-info__profile-img"
        />
        <span className="room-info__live-tag">LIVE</span>
      </div>
      {/* 방 정보 */}
      <div className="room-info__details">
        <h2 className="room-info__creator">{roomData.createdby}</h2> {/* 방 생성자 ID 표시 */}
        <p className="room-info__count">{roomData.memberCount}명이 시청중</p>
        {/* 태그 추가 */}
        <div className="room-info__tags">
          {roomData.tags.length > 0 ? (
            roomData.tags.map((tag, index) => (
              <span key={index} className="room-info__tag">
                #{tag}
              </span>
            ))
          ) : (
            <span className="room-info__tag--none">태그 없음</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomInfo;
