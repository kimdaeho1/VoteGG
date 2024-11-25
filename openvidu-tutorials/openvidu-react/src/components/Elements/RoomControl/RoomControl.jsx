import React from 'react';
import './RoomControl.css';
import EndButton from '../Buttons/EndButton/EndButton';
// import ChatTimer from '../Timer/Timer';

const RoomControl = () => {
  return (
    <div className="roomcontrol">
      <div className='aa'>
        <EndButton />
      </div>
      <div className='bb'>
        {/* <ChatTimer /> */}
      </div>
    </div>
  );
};

export default RoomControl;
