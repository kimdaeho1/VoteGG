// src/components/Elements/openvidu/OpenViduVideoComponent.js

import React, { Component } from 'react';

export default class OpenViduVideoComponent extends Component {
    constructor(props) {
        super(props);
        this.videoRef = React.createRef();
    }

    componentDidMount() {
        const { streamManager } = this.props;
        if (streamManager && this.videoRef.current) {
            try {
                streamManager.addVideoElement(this.videoRef.current);
                const connectionId = streamManager?.stream?.connection?.connectionId || 'unknown';
                console.log(`Added video element for streamManager: ${connectionId}`);
            } catch (error) {
                console.error('Error adding video element:', error);
            }
        } else {
            console.warn('No streamManager found in componentDidMount');
        }
    }

    componentDidUpdate(prevProps) {
        const { streamManager } = this.props;
        const { streamManager: prevStreamManager } = prevProps;

        if (streamManager !== prevStreamManager) {
            // Remove video element from previous streamManager
            if (prevStreamManager && typeof prevStreamManager.removeVideoElement === 'function') {
                try {
                    prevStreamManager.removeVideoElement(this.videoRef.current);
                    const connectionId = prevStreamManager?.stream?.connection?.connectionId || 'unknown';
                    console.log(`Removed video element for prevStreamManager: ${connectionId}`);
                } catch (error) {
                    console.error('Error removing video element:', error);
                }
            } else if (prevStreamManager) {
                console.warn(`prevStreamManager does not have removeVideoElement method:`, prevStreamManager);
            }

            // Add video element to new streamManager
            if (streamManager && this.videoRef.current) {
                try {
                    streamManager.addVideoElement(this.videoRef.current);
                    const connectionId = streamManager?.stream?.connection?.connectionId || 'unknown';
                    console.log(`Added video element for new streamManager: ${connectionId}`);
                } catch (error) {
                    console.error('Error adding video element:', error);
                }
            } else {
                console.warn('No streamManager found in componentDidUpdate');
            }
        }
    }

    componentWillUnmount() {
        const { streamManager } = this.props;
        if (streamManager && typeof streamManager.removeVideoElement === 'function' && this.videoRef.current) {
            try {
                streamManager.removeVideoElement(this.videoRef.current);
                const connectionId = streamManager?.stream?.connection?.connectionId || 'unknown';
                console.log(`Removed video element on unmount for streamManager: ${connectionId}`);
            } catch (error) {
                console.error('Error removing video element on unmount:', error);
            }
        } else if (streamManager) {
            console.warn(`streamManager does not have removeVideoElement method on unmount:`, streamManager);
        }
    }

    render() {
        const { muted } = this.props; // muted prop 추가

        return (
            <video
                autoPlay
                playsInline
                ref={this.videoRef}
                muted={muted} // muted prop 전달
                style={{ width: '100%', height: '100%' }}
            />
        );
    }
}
