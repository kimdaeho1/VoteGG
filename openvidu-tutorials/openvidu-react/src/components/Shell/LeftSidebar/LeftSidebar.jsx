// src/components/LeftSidebar/LeftSidebar.jsx

import React from 'react';
import HotTopics from './HotTopics/HotTopics.jsx'; // 상대 경로 확인
import './LeftSidebar.css';
import Categories from './Categories/Categories.jsx';

const LeftSidebar = () => {
  return (
    <div className="left-sidebar">
      <HotTopics />
      <Categories />
    </div>
  );
};

export default LeftSidebar;

