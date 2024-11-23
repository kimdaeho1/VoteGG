import React from 'react';

import './Search.css';

const Search = () => {



  return ();
};

export default Search;


{
  roomId ? (
    <div className="room-id-display">Room: {roomId}</div>
  ) : (
    <div className="search-container">
      <input type="text" placeholder="Search" className="search-input" />
      <img src="/magnifier.png" alt="Search Icon" className="search-icon" />
    </div>
  )
}