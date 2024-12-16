import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // axios 가져오기
import jwt_decode from "jwt-decode"; // jwt-decode 가져오기
import { useToast } from "../Toast/ToastContext";
import "./Live.css";

const Live = () => {
  const navigate = useNavigate();
  const [topRoom, setTopRoom] = useState(null); // 가장 높은 memberCount를 가진 방 하나만 저장
  const { addToast } = useToast();
  const [participants, setParticipants] = useState([]);

  // 유저 데이터 디코딩 함수
  const decodeToken = (token) => {
    try {
      const decoded = jwt_decode(token);
      return decoded;
    } catch (error) {
      console.error("토큰 디코딩 오류:", error);
      return null;
    }
  };

  // 데이터베이스에서 방 정보 가져오기
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get(
          `${window.location.origin}/api/room/roomList`
        );

        // 서버에서 반환된 전체 방 목록 출력
        const rooms = response.data;
        if (rooms && rooms.length > 0) {
          const highestMemberCountRoom = rooms.reduce((prev, current) =>
            prev.memberCount > current.memberCount ? prev : current
          );

          // participant 데이터가 null이 아닌 경우만 처리
          if (
            highestMemberCountRoom.participant &&
            Object.keys(highestMemberCountRoom.participant).length > 0
          ) {
            const participantImages = await Promise.all(
              Object.keys(highestMemberCountRoom.participant).map(
                async (username) => {
                  try {
                    const res = await axios.get(
                      `${window.location.origin}/api/user/get-profile-image`,
                      { params: { username } } // 쿼리 매개변수로 전달
                    );

                    return {
                      username,
                      profileImageUrl: res.data.profileImageUrl || "./default-avatar.jpg",
                    };
                  } catch (error) {
                    console.error(
                      `Error fetching profile image for ${username}:`,
                      error.response
                        ? `Status: ${error.response.status}, Data: ${JSON.stringify(
                            error.response.data
                          )}`
                        : error.message
                    );
                    return {
                      username,
                      profileImageUrl: "./default-avatar.jpg",
                    };
                  }
                }
              )
            );

            // 상태 업데이트
            setParticipants(participantImages); // 이미지 포함된 참가자 데이터 저장
          }

          setTopRoom(highestMemberCountRoom); // 방 정보 저장
        }
      } catch (error) {
        console.error(
          "방 목록 가져오기 실패:",
          error.response
            ? `Status: ${error.response.status}, Data: ${error.response.data}`
            : error.message
        );
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
            <span className="live-icon">LIVE</span>
            <span className="livecount">{topRoom.memberCount} 명</span>
            <h3>계란으로 토론의 흐름을 바꿔보세요!</h3>
          </div>
          <h1>{topRoom.roomname || "Untitled Room"}</h1> {/* 방 제목이 없을 경우 기본값 설정 */}
          <div className="room-tags2">
            {topRoom.tags && topRoom.tags.length > 0 ? (
              topRoom.tags.map((tag, idx) => (
                <span key={idx} className="tag-item2">
                  #{tag}
                </span>
              ))
            ) : (
              <span className="tag-placeholder">태그 없음</span>
            )}
          </div>
        </div>
        <div className="profile2-container">
          {participants.length > 0 ? (
            participants.map((participant, idx) => (
              <div key={idx} className="profile2-item">
                <img
                  src={participant.profileImageUrl} // 프로필 이미지 URL
                  alt={`${participant.username}'s profile`}
                  className="profile2-picture"
                />
                <p className="profile2-id">{participant.username}</p>
              </div>
            ))
          ) : (
            <p className="profile2-id">참가자가 없습니다</p>
          )}
        </div>
        <img
          src="./vs.png" // 임시 이미지 경로입니다
          alt="vsimg"
          className="vsimg"
        />
      </div>
    </div>
  );
};

export default Live;
