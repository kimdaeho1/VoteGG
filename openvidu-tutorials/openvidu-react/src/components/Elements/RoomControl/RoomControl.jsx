// RoomControl.jsx
import React from 'react';
import './RoomControl.css';
// import EndButton from '../Buttons/EndButton/EndButton';
import Timer from '../openvidu/Timer/Timer';
import { useParams } from 'react-router-dom';
import RoomInfo from '../Buttons/EndButton/RoomInfo';

const RoomControl = () => {
  const { roomNumber } = useParams(); // URL의 :id 부분 추출

  return (
    <div className="roomcontrol">
      <div className='aa'>
        <RoomInfo />
      </div>
      <div className='bb'>
        <Timer roomId={roomNumber} />
      </div>
    </div>
  );
};

export default RoomControl;
