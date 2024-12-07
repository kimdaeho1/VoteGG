import React, { useEffect, useState } from "react";
import "./HotTopics.css"; // 커스텀 CSS 파일 추가

const HotTopics = () => {
  const [tagCounts, setTagCounts] = useState([]); // 인기 태그 저장
  const [popularDebates, setPopularDebates] = useState({}); // 태그별 인기 토론 저장
  const [activeIndex, setActiveIndex] = useState(0); // 현재 활성화된 태그 인덱스
  const topicsLength = 4; // 주제의 개수
  const maxTitleLength = 30; // 제목의 최대 글자 수 설정

  useEffect(() => {
    // API에서 데이터 가져오기
    const fetchPopularTopics = async () => {
      try {
        const response = await fetch("/api/debate-result/popular-topics");
        const data = await response.json();
        console.log("API 응답 데이터:", data); // 응답 데이터 확인
        setTagCounts(data.popularTags); // 인기 태그 저장
        setPopularDebates(data.popularDebates); // 태그별 인기 토론 저장
      } catch (error) {
        console.error("HotTopics 데이터 가져오기 실패:", error);
      }
    };

    fetchPopularTopics();
  }, []);

  useEffect(() => {
    // 6초마다 자동으로 주제 변경
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % topicsLength); // 4개 태그 순환
    }, 6000); // 6초로 설정

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 interval 제거
  }, []);

  // 순위와 함께 아이템 렌더링
  const renderRankedItems = (data) => {
    return data.map((item, index) => {
      // 제목이 최대 길이를 초과하면 자르고 말줄임표 추가
      const shortenedTitle =
        item.roomName.length > maxTitleLength
          ? item.roomName.substring(0, maxTitleLength) + "..."
          : item.roomName;

      return (
        <div className="topic-item" key={index} style={{ marginBottom: "20px" }}>
          <div className="topic-header">
            <span className="topic-rank">{index + 1}.</span> {/* 순위 표시 */}
            <span className="topic-title">{shortenedTitle}</span>
          </div>
        </div>
      );
    });
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
    </div>
  );
};

export default HotTopics;
