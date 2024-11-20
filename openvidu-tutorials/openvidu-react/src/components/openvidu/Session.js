import React, { useEffect, useState } from 'react';
import UserVideoComponent from './UserVideoComponent.js';
import './Session.css';

const Session = ({ sessionData, onLeave }) => {
  const { session, mySessionId } = sessionData;
  const [subscribers, setSubscribers] = useState([]);
  const [mainStreamManager, setMainStreamManager] = useState(null);
  const [publisher, setPublisher] = useState(null);

  useEffect(() => {
    const onStreamCreated = (event) => {
      const subscriber = session.subscribe(event.stream, undefined);
      setSubscribers((prev) => [...prev, subscriber]);
    };

    const onStreamDestroyed = (event) => {
      const streamManager = event.stream.streamManager;
      setSubscribers((prev) => prev.filter((sub) => sub !== streamManager));
    };

    session.on('streamCreated', onStreamCreated);
    session.on('streamDestroyed', onStreamDestroyed);

    return () => {
      session.off('streamCreated', onStreamCreated);
      session.off('streamDestroyed', onStreamDestroyed);
    };
  }, [session]);

  useEffect(() => {
    const initPublisher = async () => {
      const OV = session.openvidu;
      const publisher = await OV.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: true,
        publishVideo: true,
        resolution: '640x480',
        frameRate: 30,
        mirror: false,
        audioProcessing: {
          echoCancellation: true, // 에코 제거 활성화
          noiseSuppression: true, // 소음 제거 활성화
          autoGainControl: true,  // 자동 게인 조절
        },
      });
      session.publish(publisher);
      setPublisher(publisher);
      setMainStreamManager(publisher);
    };

    initPublisher();
  }, [session]);
  
  const leaveSession = () => {
    session.disconnect();
    onLeave();
  };

  return (
    <div id="session">
      <div id="session-header">
        <h1 id="session-title">{mySessionId}</h1>
        <button className="btn btn-large btn-danger" onClick={leaveSession}>
          방 나가기
        </button>
      </div>

      {mainStreamManager && (
        <div id="main-video">
          <UserVideoComponent streamManager={mainStreamManager} />
        </div>
      )}
      <div id="video-container">
        {/* {publisher && (
          <div className="stream-container">
            <UserVideoComponent streamManager={publisher} />
          </div>
        )} */}
        {subscribers.map((sub, i) => (
          <div key={i} className="stream-container">
            <UserVideoComponent streamManager={sub} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Session;
