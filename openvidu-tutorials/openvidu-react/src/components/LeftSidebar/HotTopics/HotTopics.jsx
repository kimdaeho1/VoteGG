import React, { useEffect, useState } from 'react';

const HotTopics = () => {
  const [topics, setTopics] = useState(() => {
    const savedTopics = sessionStorage.getItem('topics');
    return savedTopics ? JSON.parse(savedTopics) : [];
  });

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch(window.location.origin + '/api/news/policy-news');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched topics:", data); // 데이터 확인
        setTopics(data); // 데이터 설정
        sessionStorage.setItem('topics', JSON.stringify(data)); // sessionStorage에 데이터 저장
      } catch (error) {
        console.error('Failed to fetch topics:', error);
        setTopics([]);
      }
    };

    if (topics.length === 0) {
      fetchTopics();
    }
  }, [topics]);

  return (
    <div>
      <h3>Hot Topics</h3>
      <ul>
        {Array.isArray(topics) && topics.length > 0 ? (
          topics.map((topic, index) => (
            <li key={index}>
              <a href={topic.link} target="_blank" rel="noopener noreferrer">
                <h4>{topic.title}</h4>
              </a>
              <p>{topic.description}</p>
              <small>{topic.date}</small>
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