// src/components/Elements/openvidu/UserVideoComponent.js

import React, { Component } from 'react';
import OpenViduVideoComponent from './OvVideo';
import './UserVideo.css';

export default class UserVideoComponent extends Component {
    getConnectionInfo() {
        const { streamManager } = this.props;
        if (streamManager) {
            const connectionData = streamManager.stream.connection;
            return {
                connectionId: connectionData.connectionId, // 연결 ID
                clientData: JSON.parse(connectionData.data)?.clientData || 'Unknown', // 사용자 정의 데이터
            };
        }
        return {};
    }

    render() {
        const { connectionId, clientData } = this.getConnectionInfo();
        const { localConnectionId } = this.props;

        // 로컬 스트림인지 확인
        const isLocalStream = connectionId === localConnectionId;

        console.log(`Rendering UserVideoComponent for ${clientData}, Connection ID: ${connectionId}, isLocalStream: ${isLocalStream}`);

        return (
            <div>
                {this.props.streamManager ? (
                    <div className="streamcomponent">
                        <OpenViduVideoComponent
                            streamManager={this.props.streamManager}
                            muted={isLocalStream} // 로컬 스트림이면 muted
                        />
                        {/* 사용자 이름 표시를 원한다면 주석을 해제하세요 */}
                        {/* <div className="connection-info">
                            <p>User: {clientData || 'No Data'}</p>
                        </div> */}
                    </div>
                ) : (
                    console.warn(`No streamManager found for user: ${clientData}, Connection ID: ${connectionId}`)
                )}
            </div>
        );
    }
}