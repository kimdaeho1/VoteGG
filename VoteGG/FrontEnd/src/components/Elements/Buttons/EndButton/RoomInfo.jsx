import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./RoomInfo.css";

const RoomInfo = () => {
  const { roomNumber } = useParams();
  const [roomData, setRoomData] = useState({
    roomname: "",
    memberCount: 0,
    createdby: "",
    creatorProfileImage: "/default-profile.png",
    tags: [],
    participant1: [],
  });
  const [participants, setParticipants] = useState([]);
  const [pollingActive, setPollingActive] = useState(true);

  // 참가자 정보 업데이트
  const updateParticipants = async () => {
    try {
      const res = await fetch(`/api/room/rooms/${roomNumber}`);
      if (!res.ok) {
        throw new Error("방 정보를 가져오는 데 실패했습니다.");
      }
      const updatedData = await res.json();

      // 참가자 이미지 업데이트
      if (updatedData.participant1 && Object.keys(updatedData.participant1).length > 0) {
        const participantImages = await Promise.all(
          Object.keys(updatedData.participant1).map(async (username) => {
            try {
              const profileRes = await axios.get(
                `${window.location.origin}/api/user/get-profile-image`,
                { params: { username } }
              );
              return {
                username,
                profileImageUrl: profileRes.data.profileImageUrl || "/default-avatar.jpg",
              };
            } catch (error) {
              console.error(`Error fetching profile image for ${username}:`, error.message);
              return {
                username,
                profileImageUrl: "/default-avatar.jpg",
              };
            }
          })
        );

        // 병합하여 참가자 상태 업데이트
        setParticipants((prev) => {
          const updated = [...prev];
          participantImages.forEach((newParticipant) => {
            if (!updated.some((p) => p.username === newParticipant.username)) {
              updated.push(newParticipant);
            }
          });
          return updated;
        });

        // 폴링 종료 조건
        if (Object.keys(updatedData.participant1).length >= 2) {
          //console.log("참가자가 2명 이상입니다. 폴링을 중단합니다.");
          setPollingActive(false);
        }
      } else {
        //console.warn("No participants found for the room.");
      }
    } catch (error) {
      console.error("참가자 정보 업데이트 오류:", error.message);
    }
  };

  // 폴링 활성화
  useEffect(() => {
    if (pollingActive) {
      const interval = setInterval(updateParticipants, 5000); // 5초마다 업데이트
      return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
    }
  }, [pollingActive]);

  useEffect(() => {
    updateParticipants(); // 초기 데이터 로드
  }, [roomNumber]);

  useEffect(() => {
    if (roomData.memberCount > (localStorage.getItem("maxViewers") || 0)) {
      localStorage.setItem("maxViewers", roomData.memberCount);
    }
  }, [roomData.memberCount]);

  return (
    <div className="room-naming">
      {/* 프로필 이미지와 LIVE 태그 추가 */}
      {participants.length > 0 ? (
        participants.map((participant, idx) => (
          <div
            key={idx}
            className="room-info__profile"
            style={
              idx !== 0
                ? { left: `${idx * 45}px` }
                : {}
            }
          >
            <img
              src={participant.profileImageUrl}
              alt={`${participant.username}의 프로필`}
              className="room-info__profile-img"
            />
            {/* <h3 className="room-info__creator">{participant.username}</h3> */}
          </div>
        ))
      ) : (
        <p className="no-participants">참가자가 없습니다</p>
      )}
    </div>
  );
};

export default RoomInfo;
