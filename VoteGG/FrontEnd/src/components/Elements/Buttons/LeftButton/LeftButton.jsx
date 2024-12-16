import React from 'react';
import { useNavigate } from 'react-router-dom';

const LeftButton = ({ roomNumber, onLeftClick }) => {
  const navigate = useNavigate();

  return (
    <div>
      <button
        onClick={() => {
          // navigate를 먼저 실행한 뒤, onLeftClick을 지연 호출
          navigate(`/room/${roomNumber}`);
          setTimeout(() => {
            if (typeof onLeftClick === 'function') {
              onLeftClick();
            }
          }, 500); // 500ms 지연
        }}
      >
        왼쪽
      </button>
      <button onClick={() => navigate(`/room/${roomNumber}`)}>오른쪽</button>
    </div>
  );
};

export default LeftButton;
