// src/components/Elements/openvidu/OpenviduFinal.js

import React, { Component } from "react";
import { OpenVidu } from "openvidu-browser";
import axios from "axios";
import UserVideoComponent from "./UserVideoComponent";
import './OpenviduFinal.css';
import { useParams } from "react-router-dom";

const APPLICATION_SERVER_URL = process.env.NODE_ENV === "production" ? "" : "https://demos.openvidu.io/";

class OpenviduFinal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            session: undefined,
            publisher: undefined,
            mainStreamManager: undefined,
            subscribers: [],
            isSharingScreen: false,
            leftUserList: [],
            rightUserList: [],
            userName: this.props.userName || 'Unknown', // 사용자 이름 설정
            currentPhase: 1,
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

        session.on("signal:phaseChange", (event) => {
            const data = JSON.parse(event.data);
            console.log("Phase changed to:", data.currentPhase);

            // 수신한 phase 값을 업데이트
            this.setState({ currentPhase: data.currentPhase });
        });


        // 다른 참가자로부터 사용자 리스트를 수신
        session.on('signal:userList', (event) => {
            const data = JSON.parse(event.data);
            console.log('수신한 사용자 리스트:', data);

            this.setState((prevState) => {
                const mergedLeftUserList = mergeUserLists(prevState.leftUserList, data.leftUserList || []);
                const mergedRightUserList = mergeUserLists(prevState.rightUserList, data.rightUserList || []);

                console.log('병합된 leftUserList:', mergedLeftUserList);
                console.log('병합된 rightUserList:', mergedRightUserList);

                return {
                    leftUserList: mergedLeftUserList,
                    rightUserList: mergedRightUserList,
                };
            });
        });

        // 새로운 참가자가 참여했을 때 사용자 리스트를 요청하는 시그널을 수신
        session.on('signal:requestUserList', (event) => {
            // 자신의 사용자 리스트를 요청한 참가자에게 전송
            session.signal({
                data: JSON.stringify({
                    leftUserList: this.state.leftUserList,
                    rightUserList: this.state.rightUserList,
                }),
                to: [event.from],
                type: 'userList',
            });
            console.log('사용자 리스트를 요청받아 전송함:', {
                leftUserList: this.state.leftUserList,
                rightUserList: this.state.rightUserList,
            });
        });

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
                connectionId: event.stream.connection.connectionId,
            };

            this.setState((prevState) => ({
                subscribers: [...prevState.subscribers, newSubscriber],
            }), () => {
                console.log('구독자 추가됨:', newSubscriber);
                console.log('현재 구독자 리스트:', this.state.subscribers);
            });
        });

        session.on('streamDestroyed', (event) => {
            const connectionId = event.stream.connection.connectionId;

            this.setState((prevState) => {
                const subscribers = prevState.subscribers.filter(
                    (sub) => sub.connectionId !== connectionId
                );

                const leftUserList = prevState.leftUserList.filter(
                    (user) => user.connectionId !== connectionId
                );
                const rightUserList = prevState.rightUserList.filter(
                    (user) => user.connectionId !== connectionId
                );

                console.log('사용자 퇴장 - connectionId:', connectionId);
                console.log('업데이트된 leftUserList:', leftUserList);
                console.log('업데이트된 rightUserList:', rightUserList);

                // 모든 참가자에게 업데이트된 사용자 리스트 전송
                session.signal({
                    data: JSON.stringify({ leftUserList, rightUserList }),
                    type: 'userList',
                });

                return {
                    subscribers,
                    leftUserList,
                    rightUserList,
                };
            });
        });

        session.on("exception", (exception) => {
            console.warn(exception);
        });

        try {
            const sessionId = this.props.sessionId; // 세션 ID
            const userName = this.state.userName; // 사용자 이름

            const token = await this.getToken(sessionId);
            await session.connect(token, { clientData: userName });

            let publisher = null;

            if (!this.props.isObserver) {
                // 관전자가 아니면 발행자 생성
                publisher = await OV.initPublisherAsync(undefined, {
                    audioSource: undefined,
                    videoSource: undefined,
                    publishAudio: true,
                    publishVideo: true,
                    resolution: '640x480',
                    frameRate: 30,
                    mirror: false,
                    audioProcessing: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    }
                });

                session.publish(publisher);
            }

            this.setState({
                session: session,
                publisher: publisher,
                mainStreamManager: publisher,
            }, () => {
                const connectionId = session.connection.connectionId;
                const newUser = { connectionId, userName };

                // 다른 참가자들에게 사용자 리스트 요청
                session.signal({
                    type: 'requestUserList',
                });

                // 1초 후에 사용자 리스트 확인 및 자신의 정보 추가
                setTimeout(() => {
                    console.log('현재 사용자 리스트 확인:', this.state.leftUserList, this.state.rightUserList);
                    this.assignUserToGroup(newUser);
                }, 1000);
            });

        } catch (error) {
            console.error("Error joining session:", error);
        }
    }

    assignUserToGroup(newUser) {
        this.setState((prevState) => {
            let leftUserList = [...prevState.leftUserList];
            let rightUserList = [...prevState.rightUserList];
            // const { roomNumber } = useParams(); 
            // const roomId = roomNumber
            // 이미 리스트에 존재하는지 확인
            const existsInLeft = leftUserList.some(user => user.connectionId === newUser.connectionId);
            const existsInRight = rightUserList.some(user => user.connectionId === newUser.connectionId);

            if (existsInLeft || existsInRight) {
                // 이미 리스트에 존재하면 추가하지 않음
                return null;
            }

            if (leftUserList.length < 2 && !this.props.isObserver) {
                leftUserList.push(newUser);
                console.log('사용자를 leftUserList에 추가:', newUser);
            } else if (rightUserList.length < 2 && !this.props.isObserver) {
                rightUserList.push(newUser);
                console.log('사용자를 rightUserList에 추가:', newUser);
            } else {
                alert('옵져버입니다.');
                // this.leaveSession();
                // window.location.href = `https://whirae3433.shop:8443/observer/${roomId}`;
                return null;

            }

            // 모든 참가자에게 업데이트된 사용자 리스트 전송
            this.state.session.signal({
                data: JSON.stringify({ leftUserList, rightUserList }),
                type: 'userList',
            });

            console.log('업데이트된 leftUserList:', leftUserList);
            console.log('업데이트된 rightUserList:', rightUserList);

            return {
                leftUserList,
                rightUserList,
            };
        });
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
            leftUserList: [],
            rightUserList: [],
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
                videoSource: "screen",
                audioSource: undefined,
                publishAudio: false,
                publishVideo: true,
            });

            screenPublisher.once("accessAllowed", () => {
                session.publish(screenPublisher);
                this.setState({
                    publisher: screenPublisher,
                    mainStreamManager: screenPublisher,
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
            session.unpublish(screenPublisher);
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
                    mainStreamManager: cameraPublisher,
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
        const { mainStreamManager, subscribers, isSharingScreen, leftUserList, rightUserList, currentPhase } = this.state;

        // 현재 세션의 모든 사용자 (본인 포함)
        const allStreamManagers = [];
        // 본인의 connectionId
        const localConnectionId = this.state.session?.connection?.connectionId;

        // 본인의 스트림 매니저 추가
        if (mainStreamManager && localConnectionId) {
            allStreamManagers.push({
                connectionId: localConnectionId,
                streamManager: mainStreamManager,
                userName: this.state.userName,
            });
        }

        // 구독자 스트림 추가
        subscribers.forEach((sub) => {
            allStreamManagers.push({
                connectionId: sub.connectionId,
                streamManager: sub.subscriber,
                userName: sub.userName,
            });
        });

        // 좌측 및 우측 사용자 스트림 매니저 매핑
        const leftStreamManagers = leftUserList.map((user) => {
            const manager = allStreamManagers.find((manager) => manager.connectionId === user.connectionId);
            if (!manager) {
                console.warn('Left user의 스트림 매니저를 찾지 못함:', user);
            }
            return manager;
        }).filter(Boolean);

        const rightStreamManagers = rightUserList.map((user) => {
            const manager = allStreamManagers.find((manager) => manager.connectionId === user.connectionId);
            if (!manager) {
                console.warn('Right user의 스트림 매니저를 찾지 못함:', user);
            }
            return manager;
        }).filter(Boolean);

        console.log('Left Stream Managers:', leftStreamManagers);
        console.log('Right Stream Managers:', rightStreamManagers);

        const handlePhaseChange = (newPhase) => {
            const { session } = this.state;
            if (session) {
                // 시그널을 통해 phase 변경값 브로드캐스트
                session.signal({
                    type: 'phaseChange',
                    data: JSON.stringify({ currentPhase: newPhase }),
                });
            }
        };

        return (
            <div className="openvidu-final">
                <div className="video-container">
                    {/* 왼쪽 참가자 */}
                    <div className="left-side">
                        {leftStreamManagers[currentPhase - 1] ? (
                            <div className="user-video">
                                <UserVideoComponent streamManager={leftStreamManagers[currentPhase - 1].streamManager} />
                                <p className="user-name">{leftStreamManagers[currentPhase - 1].userName}</p>
                            </div>
                        ) : (
                            <p className="empty-slot">대기 중</p>
                        )}
                    </div>

                    {/* 오른쪽 참가자 */}
                    <div className="right-side">
                        {rightStreamManagers[currentPhase - 1] ? (
                            <div className="user-video">
                                <UserVideoComponent streamManager={rightStreamManagers[currentPhase - 1].streamManager} />
                                <p className="user-name">{rightStreamManagers[currentPhase - 1].userName}</p>
                            </div>
                        ) : (
                            <p className="empty-slot">대기 중</p>
                        )}
                    </div>
                </div>

                {/* 화면 공유 및 방 나가기 버튼 */}
                {!this.props.isObserver && (
                    <div className="button-container">
                        <button
                            className="screen-share-button"
                            onClick={isSharingScreen ? this.stopScreenShare : this.startScreenShare}
                            style={{ background: "none", border: "none", padding: 0 }}
                        >
                            <img
                                src={isSharingScreen ? "/Buttonimg/stopshare.png" : "/Buttonimg/share.png"}
                                alt={isSharingScreen ? "Stop Screen Sharing" : "Start Screen Sharing"}
                                style={{ width: "50px", height: "50px" }}
                            />
                        </button>

                        <button
                            className="leave-session-button"
                            onClick={this.leaveSession}
                            style={{ background: "none", border: "none", padding: 0 }}
                        >
                            <img
                                src="/Buttonimg/leaveroom.png"
                                alt="Leave Room"
                                style={{ width: "50px", height: "50px" }}
                            />
                        </button>
                        {/* 단계 변경 버튼 */}
                        <div className="phase-controls">
                            <button
                                onClick={() => handlePhaseChange(Math.max(currentPhase - 1, 1))}
                                disabled={currentPhase === 1}
                            >
                                이전 참가자
                            </button>
                            <button
                                onClick={() => handlePhaseChange(Math.min(currentPhase + 1, 2))}
                                disabled={currentPhase === 2}
                            >
                                다음 참가자
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default OpenviduFinal;

// 리스트 병합 함수
function mergeUserLists(list1, list2) {
    const combined = [...list1, ...list2];
    const uniqueUsers = combined.reduce((acc, current) => {
        const x = acc.find(item => item.connectionId === current.connectionId);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []);
    return uniqueUsers;
}
