import React, { useState } from 'react';
import JoinSession from './JoinSession';
import Session from './Session';

function OpenviduFinal() {
  const [sessionData, setSessionData] = useState({
    session: undefined,
    mySessionId: 'TestRoom123',
    myUserName: `Participant${Math.floor(Math.random() * 100)}`,
  });

  const handleJoinSession = (session, userName, sessionId) => {
    setSessionData({
      session,
      mySessionId: sessionId,
      myUserName: userName,
    });
  };

  const handleLeaveSession = () => {
    setSessionData({
      session: undefined,
      mySessionId: 'SessionA',
      myUserName: `Participant${Math.floor(Math.random() * 100)}`,
    });
  };

  return (
    <div className="container">
      {sessionData.session === undefined ? (
        <JoinSession
          sessionId={sessionData.mySessionId}
          userName={sessionData.myUserName}
          onJoin={handleJoinSession}
        />
      ) : (
        <Session
          sessionData={sessionData}
          onLeave={handleLeaveSession}
        />
      )}
    </div>
  );
}

export default OpenviduFinal;
