import React, { useEffect, useState, useRef } from 'react';
import './HotTopics.css';

const HotTopics = () => {
  const [topics, setTopics] = useState([]); // 상태 관리
  const isFetched = useRef(false); // API 요청 여부를 추적

  useEffect(() => {
    // API에서 데이터를 가져오는 함수
    const fetchTopics = async () => {
      try {
        const response = await fetch('https://recordstudio.site:8443/api/news/policy-news');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched topics from API:", data);

        // 상태 업데이트
        setTopics(data);
      } catch (error) {
        console.error('Failed to fetch topics:', error);
      }
    };

    // API 요청 여부 확인 및 첫 요청만 실행
    if (!isFetched.current) {
      console.log("Fetching topics for the first time...");
      isFetched.current = true; // 요청 플래그 설정
      fetchTopics();
    }
  }, []); // 빈 배열로 설정하여 처음 렌더링 시 한 번만 실행

  return (
    <div className="hot-topics">
      <h3>Hot Topics</h3>
      <ul>
        {topics.length > 0 ? (
          topics.map((topic, index) => (
            <li key={index} className="topic-item">
              <div className="topic-header">
                <span className="topic-rank">{index + 1}. </span>
                <a href={topic.link} target="_blank" rel="noopener noreferrer" className="topic-title">
                  {topic.title}
                </a>
              </div>
            </li>
          ))
        ) : (
          <li>No topics available</li>
        )}
      </ul>
    </div>
  );
};

export default HotTopics;
