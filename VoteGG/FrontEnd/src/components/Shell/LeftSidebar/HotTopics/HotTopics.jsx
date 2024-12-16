import React, { useEffect, useState } from "react";
import "./HotTopics.css";
import TagHistoryModal from "../../../Modals/TagHistoryModal/TagHistoryModal.jsx";

const HotTopics = () => {
  const [tagCounts, setTagCounts] = useState([]); // 태그 데이터
  const [popularDebates, setPopularDebates] = useState({}); // 태그별 인기 토론 데이터
  const [activeIndex, setActiveIndex] = useState(0); // 슬라이더 인덱스
  const [selectedRoom, setSelectedRoom] = useState(null); // 선택된 방 데이터
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태
  const topicsLength = 4; // 태그 슬라이더의 길이

  // 최초 데이터 가져오기
  useEffect(() => {
    const fetchPopularTopics = async () => {
      try {
        const response = await fetch("/api/debate-result/popular-topics");
        const data = await response.json();
        setTagCounts(data.popularTags);
        setPopularDebates(data.popularDebates); // participantsArray 포함
      } catch (error) {
        console.error("HotTopics 데이터 가져오기 실패:", error);
      }
    };

    fetchPopularTopics();
  }, []);

  // 슬라이더 자동 전환
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % topicsLength);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // 방 클릭 핸들러
  const handleRoomClick = (roomId) => {
    const roomData = Object.values(popularDebates).flat().find((room) => room._id === roomId);
    setSelectedRoom(roomData); // 방 데이터 저장
    setIsModalOpen(true); // 모달 열기
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 태그별 인기 토론 목록 렌더링
  const renderRankedItems = (data) => {
    return data.map((item, index) => (
      <div
        className="topic-item"
        key={item._id}
        style={{ marginBottom: "20px" }}
        onClick={() => handleRoomClick(item._id)}
      >
        <div className="topic-header">
        <span className="topic-rank">{index + 1}.&nbsp;</span>
          <span className="topic-title">{item.roomName}</span>
        </div>
      </div>
    ));
  };

  return (
    <div className="container mt-5 hot-topics" style={{ height: "450px" }}>
      <div className="topics-slider">
        {tagCounts.map((tag, index) => (
          <div
            key={index}
            className={`topic-content ${index === activeIndex ? "active" : ""}`}
          >
            <div className="d-flex align-items-center">
              <div className="ms-3">
                <h3>#{tag}</h3>
              </div>
            </div>
            {popularDebates[tag]?.length > 0 ? (
              renderRankedItems(popularDebates[tag])
            ) : (
              <div>Loading...</div>
            )}
          </div>
        ))}
      </div>

      {/* 모달 */}
      <TagHistoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        roomData={selectedRoom}
      />
    </div>
  );
};

export default HotTopics;
