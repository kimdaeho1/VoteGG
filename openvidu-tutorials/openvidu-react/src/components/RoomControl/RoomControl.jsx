import React from 'react';
import './RoomControl.css';
import Avatar from '../Avatar/Avatar';
// import ChatTimer from '../Timer/Timer';

const RoomControl = () => {
  return (
    <div className="roomcontrol">
      <div className='aa'>
        <Avatar />
      </div>
      <div className='bb'>
        {/* <ChatTimer /> */}
      </div>
    </div>
  );
};

export default RoomControl;
