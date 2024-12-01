import React, { useEffect, useState } from 'react';
import './HotTopics.css'; // 커스텀 CSS 파일 추가

const HotTopics = () => {
  const [policyNews, setPolicyNews] = useState([]);
  const [gameRankings, setGameRankings] = useState([]);
  const [billboardChart, setBillboardChart] = useState([]);
  const [cgvMovies, setCgvMovies] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const topicsLength = 4; // 주제의 개수
  const maxTitleLength = 30; // 제목의 최대 글자 수 설정

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
    return data.map((item, index) => {
      // 제목이 최대 길이를 초과하면 자르고 말줄임표 추가
      const shortenedTitle =
        item.title.length > maxTitleLength
          ? item.title.substring(0, maxTitleLength) + '...'
          : item.title;

      return (
        <div className="topic-item" key={index} style={{ marginBottom: '20px' }}>
          <div className="topic-header">
            <span className="topic-rank">{index + 1}.</span> {/* 순위 표시 */}
            <a className="topic-title" href={item.link} target="_blank" rel="noopener noreferrer">
              {shortenedTitle} {/* 제목 표시 */}
            </a>
          </div>
        </div>
      );
    });
  };

  const topics = [
    {
      title: '뉴스 토픽',
      icon: '/newspaper.png',
      data: policyNews,
      className: 'news-topic', // 클래스 이름
    },
    {
      title: '게임 토픽',
      icon: '/controller.png',
      data: gameRankings,
      className: 'game-topic', // 클래스 이름
    },
    {
      title: '음악 토픽',
      icon: '/music.png',
      data: billboardChart,
      className: 'music-topic', // 클래스 이름
    },
    {
      title: '영화 토픽',
      icon: '/movie.png',
      data: cgvMovies,
      className: 'movie-topic', // 클래스 이름
    },
  ];

  return (
    <div className="container mt-5 hot-topics" style={{ height: '450px' }}>
      <h3 className={`text-center ${topics[activeIndex].className}-title`}>Hot Topics</h3>
      <div className="topics-slider">
        {topics.map((topic, index) => (
          
          <div
            key={index}
            className={`topic-content ${topic.className} ${
              index === activeIndex ? 'active' : ''
            }`}
          >
            <div className="d-flex align-items-center">
              <img
                src={topic.icon}
                alt={`${topic.title} Icon`}
                style={{ width: '50px', height: '50px', borderRadius: '50%' }}
              />
              <div className="ms-3">
                <h3>{topic.title}</h3>
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