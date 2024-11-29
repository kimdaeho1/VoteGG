import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';  // Bootstrap CSS 추가
import './HotTopics.css'; // 커스텀 CSS 파일 추가

const HotTopics = () => {
  const [policyNews, setPolicyNews] = useState([]);
  const [gameRankings, setGameRankings] = useState([]);
  const [billboardChart, setBillboardChart] = useState([]);
  const [cgvMovies, setCgvMovies] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0); // 현재 활성화된 주제 인덱스

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
      setActiveIndex((prevIndex) => (prevIndex + 1) % 4); // 4개 주제 순환
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

  return (
    <div className="container mt-5 hot-topics" style={{ height: '450px' }}>
      <h3>Hot Topics</h3>
      <div id="carouselExampleIndicators" className="carousel slide" data-bs-ride="carousel" style={{ position: 'relative' }}>
        
        {/* 슬라이드 항목들 */}
        <div className="carousel-inner">
          <div className={`carousel-item ${activeIndex === 0 ? "active" : ""}`}>
            <div className="d-flex justify-content-center align-items-center">
              <img 
                src="/newspaper.png" 
                alt="Policy News Icon" 
                style={{ width: '50px', height: '50px', borderRadius: '50%' }} 
              />
              <div className="ms-3">
                <h5>정책 뉴스</h5>
              </div>
            </div>
            {policyNews.length > 0 ? renderRankedItems(policyNews) : <div>Loading...</div>}
          </div>
          <div className={`carousel-item ${activeIndex === 1 ? "active" : ""}`}>
            <div className="d-flex justify-content-center align-items-center">
              <img 
                src="/controller.png" 
                alt="Game Rankings Icon" 
                style={{ width: '50px', height: '50px', borderRadius: '50%' }} 
              />
              <div className="ms-3">
                <h5>게임 랭킹</h5>
              </div>
            </div>
            {gameRankings.length > 0 ? renderRankedItems(gameRankings) : <div>Loading...</div>}
          </div>
          <div className={`carousel-item ${activeIndex === 2 ? "active" : ""}`}>
            <div className="d-flex justify-content-center align-items-center">
              <img 
                src="/music.png" 
                alt="Billboard Chart Icon" 
                style={{ width: '50px', height: '50px', borderRadius: '50%' }} 
              />
              <div className="ms-3">
                <h5>Billboard 차트</h5>
              </div>
            </div>
            {billboardChart.length > 0 ? renderRankedItems(billboardChart) : <div>Loading...</div>}
          </div>
          <div className={`carousel-item ${activeIndex === 3 ? "active" : ""}`}>
            <div className="d-flex justify-content-center align-items-center">
              <img 
                src="/movie.png" 
                alt="CGV Movies Icon" 
                style={{ width: '50px', height: '50px', borderRadius: '50%' }} 
              />
              <div className="ms-3">
                <h5>CGV 영화</h5>
              </div>
            </div>
            {cgvMovies.length > 0 ? renderRankedItems(cgvMovies) : <div>Loading...</div>}
          </div>
        </div>

        {/* 이전/다음 버튼 제거 */}
      </div>
    </div>
  );
};

export default HotTopics;

