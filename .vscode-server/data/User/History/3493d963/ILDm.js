import React, { Component } from "react";
import { OpenVidu } from "openvidu-browser";
import axios from "axios";
import UserVideoComponent from "./UserVideoComponent";

const APPLICATION_SERVER_URL = process.env.NODE_ENV === "production" ? "" : "https://demos.openvidu.io/";

class OpenviduFinal extends Component {
    constructor() {
        super();

        this.state = {
            session: undefined,
            publisher: undefined,
            leftStreamManager: undefined,
            rightStreamManager: undefined,
            subscribers: [],
            isSharingScreen: false,
        };

        this.joinSession = this.joinSession.bind(this);
        this.leaveSession = this.leaveSession.bind(this);
        this.startScreenShare = this.startScreenShare.bind(this);
        this.stopScreenShare = this.stopScreenShare.bind(this);
    }

    componentDidMount() {
        window.addEventListener("beforeunload", this.leaveSession);
        this.joinSession();
    }

    componentWillUnmount() {
        window.removeEventListener("beforeunload", this.leaveSession);
        this.leaveSession();
    }

    async joinSession() {
        const OV = new OpenVidu();
        const session = OV.initSession();

        // 다른 사용자의 스트림 구독
        session.on('streamCreated', (event) => {
            const subscriber = session.subscribe(event.stream, undefined);

            // 연결 데이터에서 clientData 추출
            let data = event.stream.connection.data;
            let userName = 'Unknown';

            try {
                const parsedData = JSON.parse(data);
                userName = parsedData.clientData || 'Unknown';
            } catch (e) {
                console.error('연결 데이터 파싱 오류:', e);
            }

            const newSubscriber = {
                subscriber: subscriber,
                userName: userName,
                left: false,
            };

            this.setState(
                (prevState) => ({
                    subscribers: [...prevState.subscribers, newSubscriber],
                }),
                () => {
                    // 상태가 업데이트된 후 로그 출력
                    console.log("---------구독과좋아요-----------", this.state.subscribers);
                    console.log("---------유저네임-----------", this.props.userName);
                }
            );
        });

        session.on('streamDestroyed', (event) => {
            const subscriberToRemove = event.stream.streamManager;

            this.setState((prevState) => ({
                subscribers: prevState.subscribers.filter(
                    (subItem) => subItem.subscriber !== subscriberToRemove
                ),
            }));
        });

        session.on("exception", (exception) => {
            console.warn(exception);
        });

        try {
            const sessionId = this.props.sessionId; // 세션 ID
            const userName = this.props.userName; // 사용자 이름

            const token = await this.getToken(sessionId);
            await session.connect(token, { clientData: userName });

            if (!this.props.isObserver) {
                // 관전자가 아니면 발행자 생성
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
                        noiseSuppression: true, // 잡음 제거 활성화
                        autoGainControl: true,  // 자동 게인 컨트롤 활성화
                    }
                });

                session.publish(publisher);

                this.setState({
                    publisher: publisher,
                    mainStreamManager: publisher,
                });
            }

            this.setState({ session: session });

        } catch (error) {
            console.error("Error joining session:", error);
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
            mainStreamManager: undefined,
            subscribers: [],
        });
    }

    async startScreenShare() {
        const { session, publisher } = this.state;

        if (!session) {
            console.error("Session not initialized");
            return;
        }

        try {
            // 기존 퍼블리셔 unpublish
            session.unpublish(publisher);

            const OV = new OpenVidu();
            const screenPublisher = OV.initPublisher(undefined, {
                videoSource: "screen", // 화면 공유
                audioSource: undefined, // 화면 공유 시 음소거
                publishAudio: false,
                publishVideo: true,
            });

            screenPublisher.once("accessAllowed", () => {
                session.publish(screenPublisher);
                this.setState({
                    publisher: screenPublisher,
                    mainStreamManager: screenPublisher, // 화면 공유 퍼블리셔로 전환
                    isSharingScreen: true,
                });
                console.log("Screen sharing started");
            });

            screenPublisher.once("accessDenied", () => {
                console.error("Screen sharing was denied");
                session.publish(publisher); // 기존 카메라 퍼블리셔 복원
            });
        } catch (error) {
            console.error("Error starting screen share:", error);
        }
    }

    stopScreenShare() {
        const { session, publisher } = this.state;

        if (!session) {
            console.error("Session not initialized");
            return;
        }

        try {
            const screenPublisher = this.state.publisher;
            session.unpublish(screenPublisher); // 화면 공유 퍼블리셔 중단
            screenPublisher.stream.getMediaStream().getTracks().forEach((track) => track.stop());

            const OV = new OpenVidu();
            OV.initPublisherAsync(undefined, {
                audioSource: undefined,
                videoSource: undefined,
                publishAudio: true,
                publishVideo: true,
                resolution: "640x480",
                frameRate: 30,
                mirror: false,
            }).then((cameraPublisher) => {
                session.publish(cameraPublisher);
                this.setState({
                    publisher: cameraPublisher,
                    mainStreamManager: cameraPublisher, // 카메라 퍼블리셔로 복원
                    isSharingScreen: false,
                });
                console.log("Screen sharing stopped, camera restored");
            });
        } catch (error) {
            console.error("Error stopping screen share:", error);
        }
    }

    async getToken(sessionId) {
        const session = await this.createSession(sessionId);
        return await this.createToken(session);
    }

    async createSession(sessionId) {
        const response = await axios.post(
            `${APPLICATION_SERVER_URL}api/sessions`,
            { customSessionId: sessionId },
            { headers: { "Content-Type": "application/json" } }
        );
        return response.data;
    }

    async createToken(sessionId) {
        const response = await axios.post(
            `${APPLICATION_SERVER_URL}api/sessions/${sessionId}/connections`,
            {},
            { headers: { "Content-Type": "application/json" } }
        );
        return response.data;
    }

    render() {
        const { mainStreamManager, subscribers, isSharingScreen } = this.state;

        return (
            <div className="openvidu-final">
                {/* 본인 화면 */}
                <div className="main-video">
                    {mainStreamManager && <UserVideoComponent streamManager={mainStreamManager} />}
                </div>
        
                {/* 화면 공유 버튼 - Observer가 아닌 경우에만 표시 */}
                {!this.props.isObserver && (
                    <button onClick={isSharingScreen ? this.stopScreenShare : this.startScreenShare}>
                        {isSharingScreen ? "Stop Screen Sharing" : "Start Screen Sharing"}
                    </button>
                )}

                {/* 다른 사용자 화면 */}
                <div className="subscribers">
                    {subscribers.map((subItem, index) => (
                        <div key={index}>
                            <UserVideoComponent streamManager={subItem.subscriber} userName={subItem.userName} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export default OpenviduFinal;
