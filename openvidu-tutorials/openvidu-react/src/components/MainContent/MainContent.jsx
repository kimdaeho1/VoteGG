// src/components/MainContent/MainContent.jsx
import React from 'react';
import ParticipantScreen from './ParticipantScreen/ParticipantScreen.jsx';
import RecordingControls from './RecordingControls/RecordingControls.jsx';
import MyFiles from './MyFiles/MyFiles.jsx';
import Controls from './Controls/Controls.jsx';
import './MainContent.css';

const MainContent = ({ roomName, team, role }) => {
  return (
    <div className="main-content">
      {/* team 정보 추가 */}
      <ParticipantScreen roomName={roomName} team={team} role={role} />
      <div className="bottom-section">
        <div className="left-controls">
          <Controls />
          <RecordingControls />
        </div>
        <div className="my-files-container">
          <MyFiles />
        </div>
      </div>
    </div>
  );
};

export default MainContent;
