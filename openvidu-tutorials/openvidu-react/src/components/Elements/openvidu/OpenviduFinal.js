// src/components/Elements/openvidu/OpenviduFinal.js

import React, { Component } from "react";
import { OpenVidu } from "openvidu-browser";
import axios from "axios";
import UserVideoComponent from "./UserVideoComponent";
import './OpenviduFinal.css';
import { triggerResetTimer } from '../../../stores/setTimerState';
import { useToast } from "../Toast/ToastContext";

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
            currentTurn: 'left',
        };

        this.joinSession = this.joinSession.bind(this);
        this.leaveSession = this.leaveSession.bind(this);
        this.startScreenShare = this.startScreenShare.bind(this);
        this.stopScreenShare = this.stopScreenShare.bind(this);
    }

    componentDidMount() {
        window.addEventListener("beforeunload", this.leaveSession);

        // Timer에서 phaseChange 이벤트 처리
        window.handlePhaseChange = (newPhase, newTurn) => {
            this.setState(
                {
                    currentPhase: newPhase,
                    currentTurn: newTurn,
                },
                () => {
                    this.updateAudioStatus();
                }
            );
        };

        this.joinSession();
    }

    componentWillUnmount() {
        window.removeEventListener("beforeunload", this.leaveSession);
        window.handlePhaseChange = null;
        this.leaveSession();
    }

    async joinSession() {
        const OV = new OpenVidu();
        const session = OV.initSession();


        // Handle phaseChange signal

        window.session = session;


        session.on("signal:phaseChange", (event) => {
            const data = JSON.parse(event.data);

            // 수신한 phase 값을 업데이트
            this.setState({
                currentPhase: data.currentPhase,
                currentTurn: data.currentTurn,
            }, () => {
                this.updateAudioStatus();
            });
        });

        // Handle userList signal
        session.on('signal:userList', (event) => {
            const data = JSON.parse(event.data);

            this.setState((prevState) => {
                const mergedLeftUserList = mergeUserLists(prevState.leftUserList, data.leftUserList || []);
                const mergedRightUserList = mergeUserLists(prevState.rightUserList, data.rightUserList || []);

                console.log('Updated user lists:', { leftUserList: mergedLeftUserList, rightUserList: mergedRightUserList });

                return {
                    leftUserList: mergedLeftUserList,
                    rightUserList: mergedRightUserList,
                };
            });
        });

        // Handle requestUserList signal
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
        });

        // Handle streamCreated event
        session.on('streamCreated', (event) => {
            const subscriber = session.subscribe(event.stream, undefined);

            // 연결 데이터에서 clientData 추출
            let data = event.stream.connection.data;
            let userName = 'Unknown';

            try {
                const parsedData = JSON.parse(data);
                userName = parsedData.clientData || 'Unknown';
            } catch (error) {
                console.warn('Error parsing connection data:', error);
            }

            const newSubscriber = {
                subscriber: subscriber,
                userName: userName,
                connectionId: event.stream.connection.connectionId,
            };

            console.log(`New subscriber added: ${userName}, Connection ID: ${newSubscriber.connectionId}`);
            console.log('Subscriber object:', subscriber);

            this.setState((prevState) => ({
                subscribers: [...prevState.subscribers, newSubscriber],
            }));
        });

        // Handle signal:toggleAudio
        session.on('signal:toggleAudio', (event) => {
            const data = JSON.parse(event.data);
            const shouldEnableAudio = data.enableAudio;
            const targetConnectionId = data.connectionId; // 특정 사용자에게만 적용

            console.log(`Received toggleAudio signal for connectionId: ${targetConnectionId}, enableAudio: ${shouldEnableAudio}`);

            // 로컬 사용자의 connectionId와 비교
            if (this.state.session && this.state.session.connection.connectionId === targetConnectionId) {
                if (this.state.publisher) {
                    this.state.publisher.publishAudio(shouldEnableAudio);
                    console.log(`Audio for user ${this.state.userName} set to ${shouldEnableAudio}`);
                }
            }
        });

        // Handle streamDestroyed event
        session.on('streamDestroyed', (event) => {
            const connectionId = event.stream.connection.connectionId;

            console.log(`Stream destroyed for Connection ID: ${connectionId}`);

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

        // Handle exceptions
        session.on("exception", (exception) => {
            console.warn(exception);
        });

        const sessionId = this.props.sessionId; // 세션 ID
        const userName = this.state.userName; // 사용자 이름

        try {
            const token = await this.getToken(sessionId);
            await session.connect(token, { clientData: userName });
            console.log('Connected to session:', sessionId);
        } catch (error) {
            console.error('Error connecting to session:', error);
            return;
        }

        let publisher = null;

        if (!this.props.isObserver) {
            try {
                // 브라우저 호환성 확인
                if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                    console.error('Media devices API is not supported in this browser.');
                    return;
                }

                // 카메라와 마이크 권한 요청
                try {
                    await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    console.log('Camera and microphone permissions granted.');
                } catch (error) {
                    console.error('Camera and microphone permission denied:', error);
                    return;
                }

                // 장치 목록 가져오기
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                console.log('Available video devices:', videoDevices);

                // 비디오 장치 유효성 검증
                if (videoDevices.length === 0) {
                    console.error('No video input devices found');
                    return;
                }

                const deviceId = videoDevices[0]?.deviceId; // 첫 번째 카메라 사용
                console.log('Using video device:', deviceId);
                publisher = await OV.initPublisherAsync(undefined, {
                    audioSource: undefined,
                    videoSource: deviceId,
                    publishAudio: true,
                    publishVideo: true,
                    resolution: '640x640',
                    frameRate: 30,
                    mirror: false,
                    audioProcessing: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    }
                });

                publisher.publishAudio(false); // 초기에는 오디오 비활성화
                session.publish(publisher);
                console.log(`Published stream for user: ${userName}`);
            } catch (error) {
                console.error('Error initializing publisher:', error);
            }
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
                this.assignUserToGroup(newUser);
            }, 1000);
        });
    }

    assignUserToGroup(newUser) {
        this.setState((prevState) => {
            let leftUserList = [...prevState.leftUserList];
            let rightUserList = [...prevState.rightUserList];

            // 이미 리스트에 존재하는지 확인
            const existsInLeft = leftUserList.some(user => user.connectionId === newUser.connectionId);
            const existsInRight = rightUserList.some(user => user.connectionId === newUser.connectionId);

            if (existsInLeft || existsInRight) {
                console.log(`User already exists in a group: ${newUser.userName}, Connection ID: ${newUser.connectionId}`);
                return null;
            }

            if (leftUserList.length < 2 && !this.props.isObserver) {
                leftUserList.push(newUser);
                console.log('Added to leftUserList:', newUser);
            } else if (rightUserList.length < 2 && !this.props.isObserver) {
                rightUserList.push(newUser);
                console.log('Added to rightUserList:', newUser);
            } else {
                // alert('Observer');
                // 옵저버로 전환하는 로직 필요 시 추가
                return null;
            }

            // 모든 참가자에게 업데이트된 사용자 리스트 전송
            this.state.session.signal({
                data: JSON.stringify({ leftUserList, rightUserList }),
                type: 'userList',
            });

            return {
                leftUserList,
                rightUserList,
            };
        }, () => {
            // 상태 업데이트 후 마이크 상태 업데이트
            this.updateAudioStatus();
        });
    }

    handleTurnChange = () => {
        const { session, currentPhase, currentTurn } = this.state;
        let newPhase = currentPhase;
        let newTurn = currentTurn;

        if (currentTurn === 'left') {
            newTurn = 'right';
        } else {
            // 양측 참가자들의 발언이 끝나면 다음 phase로 이동
            newTurn = 'left';
            newPhase = currentPhase === 1 ? 2 : 1; // Phase를 1과 2 사이에서 변경
        }

        // 새로운 phase와 turn을 모든 참가자에게 브로드캐스트
        if (session) {
            session.signal({
                type: 'phaseChange',
                data: JSON.stringify({ currentPhase: newPhase, currentTurn: newTurn }),
            });
            console.log(`Broadcasted phaseChange signal: Phase ${newPhase}, Turn ${newTurn}`);
        }

        // 타이머 초기화 등 필요한 작업 수행 (필요한 경우)
        triggerResetTimer();

        // 상태 업데이트
        this.setState({
            currentPhase: newPhase,
            currentTurn: newTurn,
        }, () => {
            this.updateAudioStatus();
        });
    };

    leaveSession() {
        const { session } = this.state;
        if (session) {
            session.disconnect();
            console.log('Disconnected from session');
        }

        // OpenVidu 객체 해제
        if (this.OV) {
            this.OV = null;
        }

        // 상태 초기화
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

        if (!session || !publisher) {
            console.error("Session or publisher not initialized");
            return;
        }

        // 기존 퍼블리셔 unpublish
        session.unpublish(publisher);
        console.log('Unpublished existing publisher for screen sharing');

        const OV = new OpenVidu();
        let screenPublisher = null;

        try {
            screenPublisher = await OV.initPublisherAsync(undefined, {
                videoSource: "screen",
                audioSource: undefined,
                publishAudio: false,
                publishVideo: true,
            });
            console.log('Initialized screen publisher');
        } catch (error) {
            console.error('Error initializing screen publisher:', error);
            // 기존 퍼블리셔 복원
            session.publish(publisher);
            console.log('Restored original publisher after screen share initialization failure');
            return;
        }

        try {
            session.publish(screenPublisher);
            this.setState({
                publisher: screenPublisher,
                mainStreamManager: screenPublisher,
                isSharingScreen: true,
            });
            console.log('Published screen share stream');
        } catch (error) {
            console.error('Error publishing screen share:', error);
            // 기존 퍼블리셔 복원
            session.publish(publisher);
            console.log('Restored original publisher after screen share publishing failure');
        }
    }

    stopScreenShare() {
        const { session, publisher } = this.state;

        if (!session || !publisher) {
            console.error("Session or publisher not initialized");
            return;
        }

        // 화면 공유 퍼블리셔 unpublish
        session.unpublish(publisher);
        console.log('Unpublished screen share publisher');

        // 화면 공유 퍼블리셔의 트랙 중지
        publisher.stream.getMediaStream().getTracks().forEach((track) => track.stop());
        console.log('Stopped all tracks of screen share publisher');

        const OV = new OpenVidu();
        let cameraPublisher = null;

        OV.initPublisherAsync(undefined, {
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
        }).then((pub) => {
            cameraPublisher = pub;
            session.publish(cameraPublisher);
            console.log('Published camera stream after stopping screen share');

            this.setState({
                publisher: cameraPublisher,
                mainStreamManager: cameraPublisher,
                isSharingScreen: false,
            });
        }).catch((error) => {
            console.error('Error initializing camera publisher after stopping screen share:', error);
        });
    }

    updateAudioStatus = () => {
        const { currentPhase, currentTurn, leftUserList, rightUserList, session } = this.state;

        if (!session) return;

        const localConnectionId = session.connection.connectionId;
        let shouldEnableAudio = false;

        // 현재 발언자인지 확인
        if (currentTurn === 'left') {
            const currentLeftUser = leftUserList[currentPhase - 1];
            if (currentLeftUser && currentLeftUser.connectionId === localConnectionId) {
                shouldEnableAudio = true;
            }
        } else {
            const currentRightUser = rightUserList[currentPhase - 1];
            if (currentRightUser && currentRightUser.connectionId === localConnectionId) {
                shouldEnableAudio = true;
            }
        }

        // 로컬 사용자의 오디오 상태만 변경
        if (this.state.publisher) {
            this.state.publisher.publishAudio(shouldEnableAudio);
            console.log(`User ${this.state.userName} audio set to ${shouldEnableAudio}`);
        }
    };

    async getToken(sessionId) {
        const session = await this.createSession(sessionId);
        return await this.createToken(sessionId);
    }

    async createSession(sessionId) {
        try {
            const response = await axios.post(
                `${APPLICATION_SERVER_URL}api/sessions`,
                { customSessionId: sessionId },
                { headers: { "Content-Type": "application/json" } }
            );
            console.log('Created session:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    }

    async createToken(sessionId) {
        try {
            const response = await axios.post(
                `${APPLICATION_SERVER_URL}api/sessions/${sessionId}/connections`,
                {},
                { headers: { "Content-Type": "application/json" } }
            );
            console.log('Created token:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating token:', error);
            throw error;
        }
    }

    render() {
        const { mainStreamManager, subscribers, isSharingScreen, leftUserList, rightUserList, currentPhase, currentTurn, session } = this.state;

        // 현재 세션의 모든 사용자 (본인 포함)
        const allStreamManagers = [];
        // 본인의 connectionId
        const localConnectionId = session?.connection?.connectionId;

        // 본인의 스트림 매니저 추가
        if (mainStreamManager && localConnectionId) {
            allStreamManagers.push({
                connectionId: localConnectionId,
                streamManager: mainStreamManager,
                userName: this.state.userName,
            });
            console.log(`Added mainStreamManager: ${localConnectionId}`);
        }

        // 구독자 스트림 추가
        subscribers.forEach((sub) => {
            allStreamManagers.push({
                connectionId: sub.connectionId,
                streamManager: sub.subscriber,
                userName: sub.userName,
            });
            console.log(`Added subscriber: ${sub.userName}, Connection ID: ${sub.connectionId}`);
        });

        // 좌측 및 우측 사용자 스트림 매니저 매핑
        const leftStreamManagers = leftUserList.map((user) => {
            const manager = allStreamManagers.find((manager) => manager.connectionId === user.connectionId);
            if (!manager) {
                console.warn(`No streamManager found for Connection ID: ${user.connectionId}`);
            }
            return manager;
        }).filter(Boolean);

        const rightStreamManagers = rightUserList.map((user) => {
            const manager = allStreamManagers.find((manager) => manager.connectionId === user.connectionId);
            if (!manager) {
                console.warn(`No streamManager found for Connection ID: ${user.connectionId}`);
            }
            return manager;
        }).filter(Boolean);

        // 현재 phase의 참가자들
        const currentLeftUser = leftStreamManagers[currentPhase - 1];
        const currentRightUser = rightStreamManagers[currentPhase - 1];

        // 현재 발언자 connectionId 계산
        const currentSpeakerConnectionId = currentTurn === 'left'
            ? currentLeftUser?.connectionId
            : currentRightUser?.connectionId;

        // 현재 사용자가 발언자인지 확인
        const isCurrentUserSpeaker = localConnectionId === currentSpeakerConnectionId;


        return (
            <div>
                <div className="openvidu-final">
                    <div className="video-container">
                        {/* 왼쪽 참가자 */}
                        <div className={`left-video ${currentTurn === 'left' && currentLeftUser ? 'active-speaker' : 'none-active-speaker'}`}>
                            {currentLeftUser ? (
                                <div className="user-video">
                                    <UserVideoComponent
                                        streamManager={currentLeftUser.streamManager}
                                        localConnectionId={localConnectionId} // 로컬 connectionId 전달
                                    />
                                    <p className="user-name">{currentLeftUser.userName} 님</p>
                                    {currentTurn === 'left' && <img className="active-speaker-image" src="/resources/images/radio.png" alt="Active Speaker" />}
                                </div>
                            ) : (
                                <img className="empty-slot" src="/unknown.png" />
                            )}
                        </div>

                        {/* 오른쪽 참가자 */}
                        <div className={`right-video ${currentTurn === 'right' && currentRightUser ? 'active-speaker' : 'none-active-speaker'}`}>
                            {currentRightUser ? (
                                <div className="user-video">
                                    <UserVideoComponent
                                        streamManager={currentRightUser.streamManager}
                                        localConnectionId={localConnectionId} // 로컬 connectionId 전달
                                    />
                                    <p className="user-name">{currentRightUser.userName} 님</p>
                                    {currentTurn === 'right' && <img className="active-speaker-image" src="/resources/images/radio.png" alt="Active Speaker" />}
                                </div>
                            ) : (
                                <img className="empty-slot" src="/unknown.png" />
                            )}
                        </div>
                    </div>
                </div>
                <div>
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
                            {isCurrentUserSpeaker ? (
                                <div className="phase-controls">
                                    <img
                                        src="/Buttonimg/leaveroom.png" // 발언자일 때 보일 이미지 경로
                                        alt="다음 차례"
                                        onClick={this.handleTurnChange} // 클릭 시 handleTurnChange 호출
                                        className="phase-controls__button phase-controls__button--active" // 스타일 추가
                                    />
                                </div>
                            ) : (
                                <div className="phase-controls">
                                    <img
                                        src="/Buttonimg/leaveroom.png" // 발언자가 아닐 때 보일 이미지 경로
                                        alt="기다리는 중."
                                        className="phase-controls__button phase-controls__button--inactive" // 스타일 추가
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
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