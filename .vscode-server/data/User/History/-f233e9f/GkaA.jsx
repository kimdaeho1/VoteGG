import React, { useEffect, useState, useRef } from "react";

const ChatOverlay = ({ messageList }) => {
    return (
      <div className="chat-overlay">
        {messageList.map((msg, index) => (
          <div key={index} className="chat-overlay-message">
            <span className="chat-author">{msg.author}:</span> {msg.message}
          </div>
        ))}
      </div>
    );
  };
  
  export default ChatOverlay;
  