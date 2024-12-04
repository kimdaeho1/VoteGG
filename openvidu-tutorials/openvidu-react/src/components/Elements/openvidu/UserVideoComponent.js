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
                connectionId: connectionData.connectionId,
                clientData: JSON.parse(connectionData.data)?.clientData || 'Unknown',
            };
        }
        return {};
    }

    render() {
        const { connectionId, clientData } = this.getConnectionInfo();
        const { localConnectionId } = this.props;

        // Check if it's the local stream
        const isLocalStream = connectionId === localConnectionId;

        console.log(`Rendering UserVideoComponent for ${clientData}, Connection ID: ${connectionId}, isLocalStream: ${isLocalStream}`);

        return (
            <div>
                {this.props.streamManager ? (
                    <div className="streamcomponent">
                        <OpenViduVideoComponent
                            streamManager={this.props.streamManager}
                            muted={isLocalStream}
                        />
                        {/* Optional: Display user name */}
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
