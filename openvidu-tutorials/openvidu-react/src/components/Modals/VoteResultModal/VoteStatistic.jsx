import React from 'react';

const VoteStatistic = ({ roomNumber, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>타이머 종료!</h2>
        <p>타이머가 종료되었습니다! 여기에 도넛 차트나 결과를 표시할 수 있습니다.</p>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

export default VoteStatistic;
