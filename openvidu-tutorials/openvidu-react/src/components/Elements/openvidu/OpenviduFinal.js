import React, { Component } from 'react';
import { OpenVidu } from 'openvidu-browser';
import axios from 'axios';
import './OpenviduFinal.css';
import UserVideoComponent from './UserVideoComponent';

const APPLICATION_SERVER_URL = process.env.NODE_ENV === 'production' ? '' : 'https://demos.openvidu.io/';

class OpenviduFinal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            session: undefined,
            publisher: undefined,
            subscribers: [],
            mainStreamManager: undefined,
        };

        this.joinSession = this.joinSession.bind(this);
        this.leaveSession = this.leaveSession.bind(this);
        this.onbeforeunload = this.onbeforeunload.bind(this);
    }

    componentDidMount() {
        window.addEventListener('beforeunload', this.onbeforeunload);
        this.joinSession();
    }

    componentWillUnmount() {
        window.removeEventListener('beforeunload', this.onbeforeunload);
        this.leaveSession();
    }

    onbeforeunload(event) {
        this.leaveSession();
    }

    async joinSession() {
        const OV = new OpenVidu();
        const session = OV.initSession();

        session.on('streamCreated', (event) => {
            const subscriber = session.subscribe(event.stream, undefined);
            this.setState((prevState) => ({
                subscribers: [...prevState.subscribers, subscriber],
            }));
        });

        session.on('streamDestroyed', (event) => {
            this.setState((prevState) => ({
                subscribers: prevState.subscribers.filter(
                    (sub) => sub !== event.stream.streamManager
                ),
            }));
        });

        session.on('exception', (exception) => {
            console.warn(exception);
        });

        try {
            const token = await this.getToken(this.props.sessionId);
            await session.connect(token, { clientData: this.props.userName });

            const publisher = await OV.initPublisherAsync(undefined, {
                audioSource: undefined,
                videoSource: undefined,
                publishAudio: true,
                publishVideo: true,
                resolution: '640x480',
                frameRate: 30,
                mirror: false,
            });

            session.publish(publisher);
            this.setState({
                session: session,
                publisher: publisher,
                mainStreamManager: publisher,
            });
        } catch (error) {
            console.error('Error joining session:', error);
        }
    }

    leaveSession() {
        const { session } = this.state;
        if (session) {
            session.disconnect();
        }
        this.setState({
            session: undefined,
            publisher: undefined,
            subscribers: [],
            mainStreamManager: undefined,
        });
    }

    async getToken(sessionId) {
        const session = await this.createSession(sessionId);
        return await this.createToken(session);
    }

    async createSession(sessionId) {
        const response = await axios.post(
            `${APPLICATION_SERVER_URL}api/sessions`,
            { customSessionId: sessionId },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    async createToken(sessionId) {
        const response = await axios.post(
            `${APPLICATION_SERVER_URL}api/sessions/${sessionId}/connections`,
            {},
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    }

    render() {
        return (
            <div className="openvidu-final">
                {this.state.mainStreamManager && (
                    <div className="main-video">
                        <UserVideoComponent streamManager={this.state.mainStreamManager} />
                    </div>
                )}
                <div className="video-container">
                    {this.state.subscribers.map((sub, index) => (
                        <div key={index} className="subscriber">
                            <UserVideoComponent streamManager={sub} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export default OpenviduFinal;
