import React, { useState } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { getToken } from '../../services/openviduService';
import './JoinSession.css'; // 스타일 파일 추가

const JoinSession = ({ sessionId, userName, onJoin }) => {
    const [mySessionId, setMySessionId] = useState(sessionId);
    const [myUserName, setMyUserName] = useState(userName);

    const handleJoinSession = async (e) => {
        e.preventDefault();

        const OV = new OpenVidu();
        const session = OV.initSession();

        try {
            const token = await getToken(mySessionId);
            await session.connect(token, { clientData: myUserName });
            onJoin(session, myUserName, mySessionId);
        } catch (error) {
            console.error('Error joining session:', error);
        }
    };

    return (
        <div className="join-session-container">
            {/* <h1 className="join-session-title">방을 생성합니다</h1> */}
            <form className="join-session-form" onSubmit={handleJoinSession}>
                {/* <div className="form-group">
                    <label htmlFor="username">사용자 이름</label>
                    <input
                        id="username"
                        className="form-input"
                        type="text"
                        value={myUserName}
                        onChange={(e) => setMyUserName(e.target.value)}
                        placeholder="사용자 이름을 입력하세요"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="session-id">세션 ID</label>
                    <input
                        id="session-id"
                        className="form-input"
                        type="text"
                        value={mySessionId}
                        onChange={(e) => setMySessionId(e.target.value)}
                        placeholder="세션 ID를 입력하세요"
                        required
                    />
                </div> */}
                <button className="join-button" type="submit">
                    CAM On
                </button>
            </form>
        </div>
    );
};

export default JoinSession;
