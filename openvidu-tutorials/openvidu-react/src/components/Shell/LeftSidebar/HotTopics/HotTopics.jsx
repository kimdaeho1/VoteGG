import React, { useEffect, useState, useRef } from 'react';
import './HotTopics.css'; // 커스텀 CSS 파일 추가

const HotTopics = () => {
  const [policyNews, setPolicyNews] = useState([]);
  const [gameRankings, setGameRankings] = useState([]);
  const [billboardChart, setBillboardChart] = useState([]);
  const [cgvMovies, setCgvMovies] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const topicsLength = 4; // 주제의 개수

  useEffect(() => {
    // 각 API에서 데이터 가져오기
    const fetchPolicyNews = async () => {
      const response = await fetch('/api/news/policy-news');
      const data = await response.json();
      setPolicyNews(data);
    };

    const fetchGameRankings = async () => {
      const response = await fetch('/api/news/game-rankings');
      const data = await response.json();
      setGameRankings(data);
    };

    const fetchBillboardChart = async () => {
      const response = await fetch('/api/news/billboard-chart');
      const data = await response.json();
      setBillboardChart(data);
    };

    const fetchCgvMovies = async () => {
      const response = await fetch('/api/news/cgv-movies');
      const data = await response.json();
      setCgvMovies(data);
    };

    // 데이터 요청
    fetchPolicyNews();
    fetchGameRankings();
    fetchBillboardChart();
    fetchCgvMovies();
  }, []);

  useEffect(() => {
    // 6초마다 자동으로 주제 변경
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % topicsLength); // 4개 주제 순환
    }, 6000); // 6초로 변경

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 interval 제거
  }, []);

  // 순위와 함께 아이템 렌더링
  const renderRankedItems = (data) => {
    return data.map((item, index) => (
      <div className="topic-item" key={index} style={{ marginBottom: '20px' }}>
        <div className="topic-header">
          <span className="topic-rank">{index + 1}</span> {/* 순위 표시 */}
          <a className="topic-title" href={item.link} target="_blank" rel="noopener noreferrer">
            {item.title} {/* 제목 표시 */}
          </a>
        </div>
      </div>
    ));
  };

  const topics = [
    {
      title: '정책 뉴스',
      icon: '/newspaper.png',
      data: policyNews,
    },
    {
      title: '게임 랭킹',
      icon: '/controller.png',
      data: gameRankings,
    },
    {
      title: 'Billboard 차트',
      icon: '/music.png',
      data: billboardChart,
    },
    {
      title: 'CGV 영화',
      icon: '/movie.png',
      data: cgvMovies,
    },
  ];

  return (
    <div className="container mt-5 hot-topics" style={{ height: '450px' }}>
      <h3>Hot Topics</h3>
      <div className="topics-slider">
        {topics.map((topic, index) => (
          <div
            key={index}
            className={`topic-content ${
              index === activeIndex ? 'active' : ''
            }`}
          >
            <div className="d-flex justify-content-center align-items-center">
              <img
                src={topic.icon}
                alt={`${topic.title} Icon`}
                style={{ width: '50px', height: '50px', borderRadius: '50%' }}
              />
              <div className="ms-3">
                <h5>{topic.title}</h5>
              </div>
            </div>
            {topic.data.length > 0 ? renderRankedItems(topic.data) : <div>Loading...</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotTopics;