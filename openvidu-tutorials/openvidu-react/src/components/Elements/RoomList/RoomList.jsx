import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RoomList.css";
import { SearchContext } from "../../../stores/SearchContext"; // Context import
import { useToast } from "../Toast/ToastContext";

const RoomList = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]); // 전체 방 목록
  const { searchQuery } = useContext(SearchContext); // Context에서 검색어 가져오기
  const [currentPage, setCurrentPage] = useState(0); // 현재 페이지 상태
  const [direction, setDirection] = useState(""); // 슬라이드 방향 (left or right)
  const { addToast } = useToast();

  // 한 페이지에 보여줄 카드 개수
  const cardsPerPage = 4;

  // 데이터베이스에서 방 정보 가져오기
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get(
          `${window.location.origin}/api/room/roomList`
        );
        setRooms(response.data); // 서버에서 받은 데이터로 상태 업데이트
      } catch (error) {
        console.error("방 목록 가져오기 실패:", error.message);
      }
    };

    fetchRooms();
  }, []);

// 검색어에 따라 필터링된 방 목록 생성
const displayedRooms = searchQuery
  ? rooms.filter((room) => {
      // 제목 또는 태그에 검색어 포함 여부 확인
      const titleMatch = room.roomname
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const tagMatch = room.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return (titleMatch || tagMatch) && room.memberCount > 0; // 추가 조건: room.memberCount > 0
    })
  : rooms.filter((room) => room.memberCount > 0); // 검색어가 없으면 전체 방 목록 중 memberCount > 0인 방만 표시

  // 총 페이지 수 계산
  const totalIndicators = Math.ceil(displayedRooms.length / cardsPerPage);

  // 현재 페이지에 보여줄 방 (빈 카드 포함)
  const visibleRooms = displayedRooms.slice(
    currentPage * cardsPerPage,
    currentPage * cardsPerPage + cardsPerPage
  );

  // 빈 카드 추가
  const filledRooms = [
    ...visibleRooms,
    ...Array(cardsPerPage - visibleRooms.length).fill({ empty: true }),
  ];

  // 참가 로직
  const joinRoom = async (roomNumber) => {
    try {
      const token = localStorage.getItem("token"); // 사용자 인증 토큰 가져오기
      if (!token) {
        addToast("로그인이 필요합니다.", "error");
        return;
      }

      // 해당 방의 participantCount를 확인
      const roomResponse = await axios.get(`${window.location.origin}/api/room/rooms/${roomNumber}`);
      const participantCount = roomResponse.data.participantCount;

      if (participantCount >= 4) {
        addToast("인원 초과로 참가할 수 없습니다.", "error");
        return;
      }

      // 참가자 추가 API 호출
      const response = await axios.post(`${window.location.origin}/api/room/participant`, {
        roomNumber,
        token,
      });

      if (response.status === 200) {
        // 방으로 이동
        navigate(`/room/${roomNumber}`);
      } else {
        addToast("참가에 실패했습니다. 다시 시도해주세요.", "error");
      }
    } catch (error) {
      console.error("방 참가 실패:", error.message);
      addToast("방 참가 중 오류가 발생했습니다.", "error");
    }
  };

  // 페이지 이동 핸들러
  const handleNext = () => {
    if (currentPage < totalIndicators - 1) {
      setDirection("right");
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setDirection("");
      }, 300); // 애니메이션 시간과 동기화
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setDirection("left");
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setDirection("");
      }, 300); // 애니메이션 시간과 동기화
    }
  };

  return (
    <div className="room-list-container">
      <div className="room-list-header">
        {/* <h1 className="room-list-title">LIVE 토론</h1> */}
      </div>
      <div className="carousel">
        <button
          className="carousel-button prev"
          onClick={handlePrev}
          disabled={currentPage === 0}
        >
          &lt;
        </button>
        <div className={`room-list-wrapper ${direction}`}>
          <div className="room-list align-evenly">
            {filledRooms.map((room, index) =>
              room.empty ? (
                <div key={`empty-${index}`} className="room-card empty"></div>
              ) : (
                <div key={room.roomNumber} className="room-card">
                  <div className="room-image">
                    <img
                      src={room.thumbnail ? `${window.location.origin}${room.thumbnail}` : "./default-thumbnail.jpg"}
                      onClick={() => navigate(`/observer/${room.roomNumber}`)}
                      className="entry-room"
                    />
                    <p className="room-member-count">{room.memberCount}명</p>
                    <p className="room-live">LIVE</p>
                  </div>
                  <div className="room-details">
                    <h2 className="room-name">{room.roomname}</h2>
                    <div className="room-info">
                      <p className="room-creator">{room.createdby} 님</p>
                    </div>
                  </div>
                  <div className='card-bottom'>
                    {/* 태그 추가 */}
                    <div className="room-tags">
                      {room.tags && room.tags.length > 0 ? (
                        room.tags.map((tag, idx) => (
                          <span key={idx} className="tag-item">
                            #{tag}
                          </span>
                        ))
                      ) : (
                        <span className="tag-placeholder">태그 없음</span>
                      )}
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
                        onClick={() => joinRoom(room.roomNumber)} // 참가 함수 호출
                        disabled={room.participantCount >= 4}
                      >
                        {room.participantCount >= 4 ? "인원 초과" : "토론하기"}
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
        <button
          className="carousel-button next"
          onClick={handleNext}
          disabled={currentPage === totalIndicators - 1}
        >
          &gt;
        </button>
      </div>
      <div className="carousel-indicators">
        {Array.from({ length: totalIndicators }).map((_, index) => (
          <span
            key={index}
            className={`indicator ${index === currentPage ? "active" : ""}`}
            onClick={() => setCurrentPage(index)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default RoomList;
