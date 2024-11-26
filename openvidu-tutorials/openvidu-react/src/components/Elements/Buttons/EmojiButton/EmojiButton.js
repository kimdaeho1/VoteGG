import React, { useState } from "react";
import EmojiPicker from "emoji-picker-react"; // 이모지 선택 라이브러리
import "./EmojiButton.css";

const EmojiButton = ({ onEmojiSelect }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const togglePicker = () => setIsPickerOpen(!isPickerOpen);

  const handleEmojiClick = (emojiObject) => {
    onEmojiSelect(emojiObject.emoji); // 부모 컴포넌트로 이모지 전달
    setIsPickerOpen(false); // 선택 후 이모지 창 닫기
  };

  return (
    <div className="emoji-button-wrapper">
      <button className="emoji-button" onClick={togglePicker}>
        <img src="/Emoji/Emoji.png" alt="Emoji" className="emoji-icon" />
      </button>
      {isPickerOpen && (
        <div className="emoji-picker">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            pickerStyle={{
              width: "300px",
              height: "400px",
            }}
            searchPlaceHolder="이모지 검색" // 검색창 텍스트 한글화
          />
        </div>
      )}
    </div>
  );
};

export default EmojiButton;
