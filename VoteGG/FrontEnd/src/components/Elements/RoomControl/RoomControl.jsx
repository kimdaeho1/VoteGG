// RoomControl.jsx
import React, { useEffect, useState } from 'react';
import './RoomControl.css';
// import EndButton from '../Buttons/EndButton/EndButton';
import Timer from '../openvidu/Timer/Timer';
import { useParams, useLocation } from 'react-router-dom';
import RoomInfo from '../Buttons/EndButton/RoomInfo';
import useTranscriptionStore from '../../../stores/transcriptionStore';

const RoomControl = ({ isObserver }) => {
  const location = useLocation();
  const { roomNumber } = useParams(); // URL의 :id 부분 추출
  const [roomname, setRoomname] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomData, setRoomData] = useState({
    roomname: "",
    memberCount: 0,
    createdby: "",
    creatorProfileImage: "/default-profile.png", // 기본 프로필 이미지
    tags: [],
  });

  const transcriptionHistory = useTranscriptionStore((state) => state.transcriptionHistory);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`/api/room/rooms/${roomNumber}`);
        if (!response.ok) {
          throw new Error("방 정보를 가져오는 데 실패했습니다.");
        }
        const data = await response.json();
        setRoomData(data);
      } catch (error) {
        console.error("방 정보 가져오기 오류:", error);
        setRoomData({
          roomname: "Unknown Room",
          memberCount: 0,
          createdby: "Unknown Creator",
          creatorProfileImage: "/default-profile.png",
          tags: [],
        });
      }
    };

    fetchRoomData();
  }, [roomNumber]);

  useEffect(() => {
    if (roomData.memberCount > (localStorage.getItem("maxViewers") || 0)) {
      localStorage.setItem("maxViewers", roomData.memberCount);
    }
  }, [roomData.memberCount]);

  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const roomId = (pathParts[1] === 'room' || pathParts[1] === 'observer')
      ? decodeURIComponent(pathParts[2])
      : null;

    if (roomId) {
      fetch(`/api/room/rooms/${roomId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('방 정보를 가져오는 데 실패했습니다.');
          }
          return response.json();
        })
        .then(data => {
          setRoomname(data.roomname || roomId);
        })
        .catch(error => {
          console.error('방 정보 가져오기 오류:', error);
        });
    }
  }, [location.pathname]);

  return (
    <div className='roomcontrol-container'>
      <div className='control-wrap'>
        <h1 className="room-title">{roomname || "untitled"}</h1>
        <div className="room-info__details">
          {/* 태그 추가 */}
          <div className="room-info__tags">
            {roomData.tags.length > 0 ? (
              roomData.tags.map((tag, index) => (
                <span key={index} className="room-info__tag">
                  #{tag}
                </span>
              ))
            ) : (
              <span className="room-info__tag--none">태그 없음</span>
            )}
          </div>
          {/* <p className="room-info__count">{roomData.memberCount}명이 시청중</p> */}
        </div>
      </div>
      <Timer roomId={roomNumber} isObserver={isObserver} className='room-timer' />
      <button onClick={toggleModal} className="transcript-button">
        대화 기록
      </button>
      {/* 모달 컴포넌트 */}
      {isModalOpen && (
        <>
          <div
            className={`transcript-modal-overlay ${isModalOpen ? 'open' : ''}`}
            onClick={toggleModal}
          />
          <div className={`transcript-modal ${isModalOpen ? 'open' : ''}`}>
            <div className="transcript-modal-content">
              <button onClick={toggleModal} className="transcript-close-button">×</button>
              <h2>대화 기록</h2>
              <div className="transcript-container">
                {transcriptionHistory.map((item, index) => (
                  <div key={index} className="transcription-item">
                    <span className={`roomcontrol-speaker ${item.position === 'left' ? 'left' :
                        item.position === 'right' ? 'right' :
                          'observer'
                      }`}>
                      {item.speaker}:
                    </span>
                    <span className="text">{item.text}</span>
                    <span className="timestamp">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RoomControl;
