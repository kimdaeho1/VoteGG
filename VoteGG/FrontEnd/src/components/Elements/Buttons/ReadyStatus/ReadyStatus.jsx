// ReadyStatus.jsx
import React from 'react';
import './ReadyStatus.css'

const ReadyStatus = ({ readyUsers }) => {
  return (
    <div className="ready-status">
      레디 새로고침시 고장남: {readyUsers}/2
    </div>
  );
};

export default ReadyStatus;