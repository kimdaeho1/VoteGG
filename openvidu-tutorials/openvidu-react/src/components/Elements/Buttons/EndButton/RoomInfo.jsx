import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './RoomInfo.css';

const RoomInfo = () => {
  const { roomNumber } = useParams(); // URL에서 방 번호 가져오기
  const [roomData, setRoomData] = useState({
    roomname: '',
    memberCount: 0,
    tags: [], // 태그 상태 추가
  });

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`/api/room/rooms/${roomNumber}`);
        if (!response.ok) {
          throw new Error("방 정보를 가져오는 데 실패했습니다.");
        }
        const data = await response.json();
        setRoomData({
          roomname: data.roomname,
          memberCount: data.memberCount,
          tags: data.tags || [], // 태그가 없으면 빈 배열 처리
        });
      } catch (error) {
        console.error("방 정보 가져오기 오류:", error);
        setRoomData({
          roomname: 'Unknown Room',
          memberCount: 9999,
          tags: [], // 오류 시 기본 값
        });
      }
    };

    fetchRoomData();
  }, [roomNumber]);

  return (
    <div className="room-naming">
      <h1 className="room-info__title">{roomData.roomname}</h1>
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
  );
};

export default RoomInfo;

