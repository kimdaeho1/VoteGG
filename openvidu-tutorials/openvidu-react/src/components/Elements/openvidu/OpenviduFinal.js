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
            createdBy: this.props.createdBy || 'Unknown',
            currentPhase: 1,
            currentTurn: 'left',
            leftUserArgument: '',
            rightUserArgument: '',
            isLeftUserEditing: false,
            isRightUserEditing: false,
            isstart: this.props.isstart
        };

        // 인스턴스 변수로 eventCanvas 선언
        this.eventCanvas = null;

        this.joinSession = this.joinSession.bind(this);
        this.leaveSession = this.leaveSession.bind(this);
        this.startScreenShare = this.startScreenShare.bind(this);
        this.stopScreenShare = this.stopScreenShare.bind(this);
        this.toggleLeftUserEdit = this.toggleLeftUserEdit.bind(this);
        this.toggleRightUserEdit = this.toggleRightUserEdit.bind(this);
        this.handleArgumentChange = this.handleArgumentChange.bind(this);
        this.sendArgumentSignal = this.sendArgumentSignal.bind(this);
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

    componentDidUpdate(prevProps) {
        // isstart가 false -> true로 변경될 때 서버로 데이터 전송
        if (!prevProps.isstart && this.props.isstart) {
            this.saveArgumentsToServer();
        }
    }


    async saveArgumentsToServer() {
        const { leftUserArgument, rightUserArgument, currentLeftUser, currentRightUser, leftUserList, rightUserList, userName} = this.state;

        // userName과 createdBy가 같을 때만 요청 전송
        console.log(userName,"-----------",this.props.createdBy)
        if (userName === this.props.createdBy) {
            const payload = {
                leftUserArgument,
                rightUserArgument,
                leftUserId: currentLeftUser?.userId || null,
                rightUserId: currentRightUser?.userId || null,
                leftUserList,
                rightUserList,
                roomNumber : this.props.sessionId,
            };
            console.log("Payload being sent:", payload); // 추가된 디버깅 코드
            try {
                const response = await fetch('/api/room/saveargument', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    console.error('Failed to save arguments:', response.statusText);
                } else {
                    console.log('Arguments saved successfully');
                }
            } catch (error) {
                console.error('Error while saving arguments:', error);
            }
        } else {
            console.log('Request not sent: userName and createdBy do not match.');
        }
    }
    async joinSession() {
        const OV = new OpenVidu();
        const session = OV.initSession();


        // Handle phaseChange signal

        window.session = session;

        // 기존 주장 데이터를 새로운 사용자가 받도록 처리 추가
        session.on('connectionCreated', (event) => {
            if (event.connection.connectionId !== session.connection.connectionId) {
                session.signal({
                    data: JSON.stringify({
                        leftUserList: this.state.leftUserList,
                        rightUserList: this.state.rightUserList,
                        leftUserArgument: this.state.leftUserArgument,
                        rightUserArgument: this.state.rightUserArgument,
                    }),
                    to: [event.connection],
                    type: 'userList',
                });
                // console.log(`Sent user list to newly connected user: ${event.connection.connectionId}`);
            }
        });

        session.on('signal:argumentUpdate', (event) => {
            const data = JSON.parse(event.data);
            const { argumentKey, argumentValue } = data;
            this.setState({ [argumentKey]: argumentValue });
        });

        session.on("signal:phaseChange", (event) => {
            const data = JSON.parse(event.data);

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
            // console.log('Received userList signal:', data); // 디버깅용
            this.setState((prevState) => {
                const mergedLeftUserList = mergeUserLists(prevState.leftUserList, data.leftUserList || []);
                const mergedRightUserList = mergeUserLists(prevState.rightUserList, data.rightUserList || []);

                return {
                    leftUserList: mergedLeftUserList,
                    rightUserList: mergedRightUserList,
                    leftUserArgument: prevState.leftUserArgument || data.leftUserArgument || '',
                    rightUserArgument: prevState.rightUserArgument || data.rightUserArgument || '',
                };
            });
        });

        // Handle requestUserList signal
        session.on('signal:requestUserList', (event) => {
            // 자신의 용자 리스트와 주장 텍스트를 요청한 참가자에게 전송
            session.signal({
                data: JSON.stringify({
                    leftUserList: this.state.leftUserList,
                    rightUserList: this.state.rightUserList,
                    leftUserArgument: this.state.leftUserArgument,
                    rightUserArgument: this.state.rightUserArgument,
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
                // console.warn('Error parsing connection data:', error);
            }

            const newSubscriber = {
                subscriber: subscriber,
                userName: userName,
                connectionId: event.stream.connection.connectionId,
            };

            // console.log(`New subscriber added: ${userName}, Connection ID: ${newSubscriber.connectionId}`);
            //console.log('Subscriber object:', subscriber);

            this.setState((prevState) => ({
                subscribers: [...prevState.subscribers, newSubscriber],
            }));
        });

        // Handle signal:toggleAudio
        session.on('signal:toggleAudio', (event) => {
            const data = JSON.parse(event.data);
            const shouldEnableAudio = data.enableAudio;
            const targetConnectionId = data.connectionId; // 특정 사용자에게만 적용

            //console.log(`Received toggleAudio signal for connectionId: ${targetConnectionId}, enableAudio: ${shouldEnableAudio}`);

            // 로컬 사용자의 connectionId와 비교
            if (this.state.session && this.state.session.connection.connectionId === targetConnectionId) {
                if (this.state.publisher) {
                    this.state.publisher.publishAudio(shouldEnableAudio);
                    //console.log(`Audio for user ${this.state.userName} set to ${shouldEnableAudio}`);
                }
            }
        });

        // Handle streamDestroyed event
        session.on('streamDestroyed', (event) => {
            const connectionId = event.stream.connection.connectionId;

            //console.log(`Stream destroyed for Connection ID: ${connectionId}`);

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
            //console.warn(exception);
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
            let cameraStream;
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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

            // hiddenVideo 설정
            const hiddenVideo = document.createElement('video');
            hiddenVideo.style.position = 'absolute';
            hiddenVideo.style.top = '-9999px';
            hiddenVideo.style.left = '-9999px';
            document.body.appendChild(hiddenVideo);
            hiddenVideo.srcObject = cameraStream;
            hiddenVideo.muted = true; 
            hiddenVideo.playsInline = true;
            try {
                await hiddenVideo.play();
                console.log('hiddenVideo play started');
            } catch (err) {
                console.error('Error playing video:', err);
            }

            console.log('Camera tracks:', cameraStream.getVideoTracks());

            // 비디오가 로드되어 videoWidth, videoHeight를 얻을 수 있을 때까지 대기
            await new Promise((resolve) => {
                if (hiddenVideo.readyState >= hiddenVideo.HAVE_CURRENT_DATA) {
                    resolve();
                } else {
                    hiddenVideo.addEventListener('loadeddata', () => resolve(), { once: true });
                }
            });

            const streamWidth = hiddenVideo.videoWidth;
            const streamHeight = hiddenVideo.videoHeight;
            console.log(`Stream resolution: ${streamWidth}x${streamHeight}`);

            // 오버레이 이미지 위치 상태 (스트리밍 해상도 기준)
            let overlayX = 50;
            let overlayY = 50;
            let isDragging = false;
            let dragOffsetX = 0;
            let dragOffsetY = 0;

            // 오버레이 이미지 로드
            const overlayImage = new Image();
            //overlayImage.src = '/resources/images/egg.png';
            //await overlayImage.decode();

            function calculateSyncRatio(baseWidth, baseHeight, baseRatio) {
                const currentWidth = window.innerWidth; // 현재 화면의 너비
                const currentHeight = window.innerHeight; // 현재 화면의 높이
                const syncRatioWidth = (currentWidth / baseWidth) * baseRatio;
                const syncRatioHeight = (currentHeight / baseHeight) * baseRatio;
                return {syncRatioWidth, syncRatioHeight};
            }
            
            // 기준 해상도 및 비율
            const baseWidth = 1920;
            const baseHeight = 1080;
            const baseRatio = 0.8851;
            
            // 동기화 비율 계산
            const {syncRatioWidth, syncRatioHeight} = calculateSyncRatio(baseWidth, baseHeight, baseRatio);
            const hiddenCanvas = document.createElement('canvas');
            hiddenCanvas.width = streamWidth * syncRatioWidth;
            hiddenCanvas.height = streamHeight * syncRatioHeight;
            const hiddenCtx = hiddenCanvas.getContext('2d');

            function drawFrame() {
                hiddenCtx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
    
                // 기존 비디오와 오버레이 이미지 그리기
                if (hiddenVideo.readyState >= hiddenVideo.HAVE_CURRENT_DATA) {
                    hiddenCtx.drawImage(hiddenVideo, 0, 0, hiddenCanvas.width, hiddenCanvas.height);
                }

                // 오버레이 이미지 그리기
                if (overlayImage.complete && overlayImage.naturalWidth > 0) {
                    hiddenCtx.drawImage(
                        overlayImage,
                        overlayX,
                        overlayY,
                        overlayImage._drawWidth || overlayImage.naturalWidth,
                        overlayImage._drawHeight || overlayImage.naturalHeight
                    );
                } else {
                    console.warn("Overlay image not ready to draw.");
                }

                requestAnimationFrame(drawFrame);
            }
            requestAnimationFrame(drawFrame);

            // hiddenCanvas로부터 스트림 확보
            const canvasStream = hiddenCanvas.captureStream(30);

            // 이벤트 전용 캔버스(eventCanvas) 생성: 마우스 이벤트만 처리 (투명)
            this.eventCanvas = document.createElement('canvas');
            this.eventCanvas.width = hiddenCanvas.width;
            this.eventCanvas.height = hiddenCanvas.height;
            this.eventCanvas.style.position = 'absolute';
            this.eventCanvas.style.top = '0';
            this.eventCanvas.style.left = '0';
            this.eventCanvas.style.zIndex = 10000; // 다른 요소 위로
            this.eventCanvas.style.pointerEvents = 'auto';
            this.eventCanvas.style.background = 'transparent';
            
            // 비디오 컨테이너를 찾아 상대 위치 지정
            const videoContainer = document.querySelector('.video-container');
            if (!videoContainer) {
                console.error('No .video-container element found!');
                return;
            }
            videoContainer.style.position = 'relative';
            videoContainer.appendChild(this.eventCanvas);


            // S3 업로드 함수 추가
            async function uploadImageToS3(file) {
                try {
                    // 프리사인드 URL 생성 요청
                    const presignedResponse = await axios.post(`${window.location.origin}/api/generate-presigned-url`, {
                        filename: file.name,
                        contentType: file.type,
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
            
                    const { url: presignedUrl, key } = presignedResponse.data;
            
                    // S3로 이미지 업로드
                    const uploadResponse = await axios.put(presignedUrl, file, {
                        headers: { 'Content-Type': file.type },
                    });
            
                    if (uploadResponse.status === 200) {
                        const imageUrl = `https://${process.env.REACT_APP_AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
                        console.log('Image uploaded to S3:', imageUrl);
                        console.log('S3 Key:', key);
                        return imageUrl; // S3에 저장된 이미지 URL 반환
                    }
                } catch (error) {
                    console.error('Error uploading image to S3:', error);
                    throw error;
                }
            }
  
            // 캔버스 드래그 앤 드롭 이벤트 처리
            this.eventCanvas.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy'; // 드롭 효과 설정
            });
            
            let activeOverlay = null; // 현재 활성화된 오버레이를 추적
            let videoElement = null; // videoElement를 전역 변수로 선언

            this.eventCanvas.addEventListener('drop', async (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
            
                if (file) {
                    if (file.type.startsWith('image/')) {
                        console.log('Image file dropped:', file);

                        try {
                            const imageUrl = await uploadImageToS3(file);

                            const rect = this.eventCanvas.getBoundingClientRect();
                            const mouseX = e.clientX - rect.left;
                            const mouseY = e.clientY - rect.top;

                            const scaleX = hiddenCanvas.width / this.eventCanvas.width;
                            const scaleY = hiddenCanvas.height / this.eventCanvas.height;

                            overlayX = mouseX * scaleX;
                            overlayY = mouseY * scaleY;

                            overlayImage.crossOrigin = 'Anonymous';
                            overlayImage.src = `${imageUrl}?t=${Date.now()}`;
                            overlayImage.onload = () => {
                                console.log('Overlay image updated to:', overlayImage.src);
                                activeOverlay = 'image'; // 이미지가 활성화됨
                                redrawCanvas();
                            };
                            overlayImage.onerror = () => {
                                console.error('Failed to load overlay image:', overlayImage.src);
                            };
                        } catch (error) {
                            console.error('Error handling dropped image file:', error);
                        }
                    } else if (file.type.startsWith('video/')) {
                        console.log('Video file dropped:', file);

                        try {
                            videoElement = document.createElement('video'); // videoElement를 전역 변수로 설정
                            const videoUrl = await uploadImageToS3(file);

                            videoElement.src = `${videoUrl}?t=${Date.now()}`;
                            videoElement.crossOrigin = 'Anonymous';
                            videoElement.loop = true;
                            videoElement.muted = true;
                            videoElement.style.position = 'absolute';
                            videoElement.style.top = '0';
                            videoElement.style.left = '0';
                            videoElement.style.width = '200px'; // 초기 크기 설정
                            videoElement.style.height = '150px'; // 초기 크기 설정
                            videoElement.style.zIndex = 10001;
                            videoElement.style.pointerEvents = 'none';

                            // 초기 크기 설정
                            videoElement.width = 200; // 비디오 요소의 width 속성 설정
                            videoElement.height = 150; // 비디오 요소의 height 속성 설정

                            // 비디오가 로드될 때까지 대기
                            videoElement.onloadeddata = () => {
                                console.log('Video loaded:', videoElement.src);
                                activeOverlay = 'video'; // 비디오가 활성화됨
                                redrawCanvas();

                                // 비디오 재생 시작
                                videoElement.play().then(() => {
                                    console.log('Video is playing');
                                }).catch((error) => {
                                    console.error('Error playing video:', error);
                                });

                                // 비디오 프레임을 지속적으로 그리기
                                function drawVideoFrame() {
                                    if (activeOverlay === 'video' && videoElement && videoElement.readyState >= videoElement.HAVE_CURRENT_DATA) {
                                        hiddenCtx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
                                        hiddenCtx.drawImage(hiddenVideo, 0, 0, hiddenCanvas.width, hiddenCanvas.height);
                                        hiddenCtx.drawImage(videoElement, overlayX, overlayY, videoElement.width, videoElement.height);
                                    }
                                    if (activeOverlay === 'video') {
                                        requestAnimationFrame(drawVideoFrame);
                                    }
                                }
                                requestAnimationFrame(drawVideoFrame);
                            };

                            // 비디오 드래그 앤 드롭 기능 추가
                            this.eventCanvas.addEventListener('mousedown', (e) => {
                                const rect = this.eventCanvas.getBoundingClientRect();
                                const mouseX = e.clientX - rect.left;
                                const mouseY = e.clientY - rect.top;

                                if (videoElement && videoElement.readyState >= videoElement.HAVE_CURRENT_DATA) { // videoElement가 존재하는지 확인
                                    if (
                                        mouseX >= overlayX && mouseX <= overlayX + videoElement.videoWidth &&
                                        mouseY >= overlayY && mouseY <= overlayY + videoElement.videoHeight
                                    ) {
                                        isDragging = true;
                                        dragOffsetX = mouseX - overlayX;
                                        dragOffsetY = mouseY - overlayY;
                                    }
                                }
                            });

                            // 비디오 클릭 시 재생/멈춤 토글
                            this.eventCanvas.addEventListener('click', (e) => {
                                const rect = this.eventCanvas.getBoundingClientRect();
                                const mouseX = e.clientX - rect.left;
                                const mouseY = e.clientY - rect.top;

                                if (videoElement && videoElement.readyState >= videoElement.HAVE_CURRENT_DATA) {
                                    if (
                                        mouseX >= overlayX && mouseX <= overlayX + videoElement.width &&
                                        mouseY >= overlayY && mouseY <= overlayY + videoElement.height
                                    ) {
                                        console.log("videoElement click!!");
                                        e.preventDefault();
                                        if (videoElement.paused) {
                                            videoElement.play();
                                        } else {
                                            videoElement.pause();
                                        }
                                    }
                                }
                            });

                            this.eventCanvas.addEventListener('mousemove', (e) => {
                                if (isDragging) {
                                    const rect = this.eventCanvas.getBoundingClientRect();
                                    const mouseX = e.clientX - rect.left;
                                    const mouseY = e.clientY - rect.top;

                                    overlayX = mouseX - dragOffsetX;
                                    overlayY = mouseY - dragOffsetY;
                                }
                            });

                            this.eventCanvas.addEventListener('mouseup', () => {
                                isDragging = false;
                            });

                            this.eventCanvas.addEventListener('mouseleave', () => {
                                isDragging = false;
                            });                            

                        } catch (error) {
                            console.error('Error handling dropped video file:', error);
                        }
                    } else {
                        console.warn('Dropped file is not a valid image or video');
                    }
                }
            });


            // 팝업 메뉴 생성
            const contextMenu = document.createElement('div');
            contextMenu.style.position = 'absolute';
            contextMenu.style.display = 'none';
            contextMenu.style.backgroundColor = '#fff';
            contextMenu.style.border = '1px solid #ccc';
            contextMenu.style.padding = '8px';
            contextMenu.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
            contextMenu.style.cursor = 'pointer';
            contextMenu.innerText = '삭제';
            contextMenu.style.zIndex = '10000';
            document.body.appendChild(contextMenu);

            // 팝업 메뉴 내용 초기화
            contextMenu.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div style="margin-bottom: 5px;">
                    <label>
                        가로:
                        <input type="number" id="overlayWidth" style="width: 60px;" />
                    </label>
                </div>
                <div style="margin-bottom: 5px;">
                    <label>
                        세로:
                        <input type="number" id="overlayHeight" style="width: 60px;" />
                    </label>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="resizeButton" style="display: block; width: 100%;">변경하기</button>
                </div>
                <div>
                    <button id="deleteButton" style="display: block; width: 100%; color: red;">삭제하기</button>
                </div>
            </div>
            `;

            // 팝업 메뉴 이벤트 추가
            const resizeButton = document.getElementById('resizeButton');
            const deleteButton = document.getElementById('deleteButton');
            const overlayWidthInput = document.getElementById('overlayWidth');
            const overlayHeightInput = document.getElementById('overlayHeight');

            // 마우스 우클릭 이벤트 처리
            this.eventCanvas.addEventListener('contextmenu', (e) => {
                const rect = this.eventCanvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const isInsideVideo = videoElement && // videoElement가 존재하는지 확인
                    mouseX >= overlayX &&
                    mouseX <= overlayX + videoElement.videoWidth &&
                    mouseY >= overlayY &&
                    mouseY <= overlayY + videoElement.videoHeight;

                const isInsideImage = overlayImage.src && // overlayImage가 존재하는지 확인
                    mouseX >= overlayX &&
                    mouseX <= overlayX + (overlayImage._drawWidth || overlayImage.naturalWidth) &&
                    mouseY >= overlayY &&
                    mouseY <= overlayY + (overlayImage._drawHeight || overlayImage.naturalHeight);

                if (isInsideVideo || isInsideImage) {
                    e.preventDefault(); // 기본 브라우저 우클릭 메뉴 막기

                    console.log('Showing custom context menu');

                    // 팝업 메뉴 위치 설정
                    const menuX = e.clientX;
                    const menuY = e.clientY;

                    contextMenu.style.top = `${menuY}px`;
                    contextMenu.style.left = `${menuX}px`;
                    contextMenu.style.display = 'block';

                    // 현재 오버레이 크기를 입력 필드에 표시
                    if (isInsideImage) {
                        overlayWidthInput.value = overlayImage._drawWidth || overlayImage.naturalWidth;
                        overlayHeightInput.value = overlayImage._drawHeight || overlayImage.naturalHeight;
                    } else if (isInsideVideo && videoElement) {
                        overlayWidthInput.value = videoElement.width;
                        overlayHeightInput.value = videoElement.height;
                    }
                } else {
                    console.log('Outside overlay. Showing default context menu');
                    contextMenu.style.display = 'none'; // 커스텀 팝업 숨기기
                }
            });

            // 크기 조절 버튼 클릭 이벤트
            if (resizeButton) {
                resizeButton.addEventListener('click', () => {
                    const newWidth = parseInt(overlayWidthInput.value, 10);
                    const newHeight = parseInt(overlayHeightInput.value, 10);

                    console.log('Input Values:', { newWidth, newHeight });

                    if (!isNaN(newWidth) && newWidth > 0 && !isNaN(newHeight) && newHeight > 0) {
                        if (activeOverlay === 'image') {
                            overlayImage._drawWidth = newWidth;
                            overlayImage._drawHeight = newHeight;
                        } else if (activeOverlay === 'video' && videoElement) {
                            videoElement.width = newWidth;
                            videoElement.height = newHeight;
                        }

                        console.log('Overlay dimensions set to:', {
                            width: newWidth,
                            height: newHeight,
                        });

                        redrawCanvas();
                    } else {
                        console.warn('Invalid size inputs');
                    }

                    contextMenu.style.display = 'none'; // 팝업 닫기
                });
            }

            // 캔버스 다시 그리기 함수
            function redrawCanvas() {
                hiddenCtx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
                hiddenCtx.drawImage(hiddenVideo, 0, 0, hiddenCanvas.width, hiddenCanvas.height);

                if (activeOverlay === 'image' && overlayImage.src && overlayImage.src !== '') {
                    hiddenCtx.drawImage(
                        overlayImage,
                        overlayX,
                        overlayY,
                        overlayImage._drawWidth || overlayImage.naturalWidth,
                        overlayImage._drawHeight || overlayImage.naturalHeight
                    );
                }

                if (activeOverlay === 'video' && videoElement && videoElement.readyState >= videoElement.HAVE_CURRENT_DATA) {
                    hiddenCtx.drawImage(
                        videoElement,
                        overlayX,
                        overlayY,
                        videoElement.width,
                        videoElement.height
                    );
                }
            }

            // 삭제 버튼 클릭 이벤트
            if (deleteButton) {
                deleteButton.addEventListener('click', () => {
                    console.log('Removing overlay image');
                    overlayImage.src = ''; // 이미지 제거
                    overlayX = 0;
                    overlayY = 0;

                    // 비디오 오버레이 제거
                    if (videoElement) {
                        videoElement.pause(); // 비디오 재생 중지
                        videoElement.src = ''; // 비디오 소스 제거
                        videoElement.remove(); // 비디오 요소 제거
                        videoElement = null; // 비디오 요소 참조 초기화
                        activeOverlay = null;
                    }

                    // 캔버스 초기화
                    hiddenCtx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
                    hiddenCtx.drawImage(hiddenVideo, 0, 0, hiddenCanvas.width, hiddenCanvas.height);

                    contextMenu.style.display = 'none'; // 팝업 닫기
                });
            }

            // 팝업 내부 클릭 시 이벤트 전파 방지
            contextMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // 팝업 외부 클릭 시 닫기
            document.addEventListener('click', (e) => {
                if (!contextMenu.contains(e.target)) {
                    contextMenu.style.display = 'none';
                }
            });

            // 이벤트 핸들러
            this.eventCanvas.addEventListener('mousedown', (e) => {
                console.log("mousedown!!");
                const rect = this.eventCanvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // 마우스 좌표를 스트리밍 해상도 좌표로 변환
                const { streamingMouseX, streamingMouseY } = {streamingMouseX: mouseX, streamingMouseY: mouseY};

                if (
                    streamingMouseX >= overlayX && streamingMouseX <= overlayX + overlayImage.width &&
                    streamingMouseY >= overlayY && streamingMouseY <= overlayY + overlayImage.height
                ) {
                    isDragging = true;
                    dragOffsetX = streamingMouseX - overlayX;
                    dragOffsetY = streamingMouseY - overlayY;
                }
            });

            this.eventCanvas.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const rect = this.eventCanvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;

                    const { streamingMouseX, streamingMouseY } = {streamingMouseX: mouseX, streamingMouseY: mouseY};
                    overlayX = streamingMouseX - dragOffsetX;
                    overlayY = streamingMouseY - dragOffsetY;
                }
            });

            this.eventCanvas.addEventListener('mouseup', () => {
                console.log("mouseup!!");
                isDragging = false;
            });

            this.eventCanvas.addEventListener('mouseleave', () => {
                isDragging = false;
            });

            // 퍼블리셔 생성 시 hiddenCanvas 스트림을 비디오 소스로 사용 (원본 해상도 유지)
            publisher = await OV.initPublisherAsync(undefined, {
                audioSource: cameraStream.getAudioTracks()[0],
                videoSource: canvasStream.getVideoTracks()[0],
                publishAudio: true,
                publishVideo: true,
                resolution: `${streamWidth}x${streamHeight}`, 
                frameRate: 30,
                mirror: false,
                audioProcessing: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });

            // 초기 오디오 비활성화
            publisher.publishAudio(false); 
            session.publish(publisher);
            console.log(`Published composite (camera+overlay) stream for user: ${this.state.userName}`);

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
        return new Promise((resolve) => {
            this.setState((prevState) => {
                let leftUserList = [...prevState.leftUserList];
                let rightUserList = [...prevState.rightUserList];

                // 이미 리스트에 존재하는지 확인
                const existsInLeft = leftUserList.some(user => user.connectionId === newUser.connectionId);
                const existsInRight = rightUserList.some(user => user.connectionId === newUser.connectionId);

                if (existsInLeft || existsInRight) {
                    //console.log(`User already exists in a group: ${newUser.userName}, Connection ID: ${newUser.connectionId}`);
                    resolve(null);
                    return null;
                }

                // 동기화된 그룹 할당 로직
                if (this.props.createdBy === this.props.userName && !this.props.isObserver) {
                    leftUserList.push(newUser);
                    //console.log('Added to leftUserList:', newUser);
                } else if (!this.props.isObserver) {
                    rightUserList.push(newUser);
                    //console.log('Added to rightUserList:', newUser);
                } else {
                    resolve(null);
                    return null;
                }

                /*
                const leftVideoContainer = document.querySelector('.left-video');
                const rightVideoContainer = document.querySelector('.right-video');
                if (this.state.userName != this.props.createdBy) {
                    console.log("right");
                    if (this.eventCanvas) {
                        this.eventCanvas.style.left = `${1280*0.8851 - 640 * 0.8851 + 20}px`; // 위치 조정
                        rightVideoContainer.appendChild(this.eventCanvas);
                    }
                } else {
                    leftVideoContainer.appendChild(this.eventCanvas);
                }
                */

                // MutationObserver로 DOM 변화를 감지
                const observer = new MutationObserver(() => {
                    const leftVideoContainer = document.querySelector('.left-video .user-video .streamcomponent');
                    const rightVideoContainer = document.querySelector('.right-video .user-video .streamcomponent');

                    if (this.state.userName !== this.props.createdBy) {
                        if (rightVideoContainer && this.eventCanvas) {
                            rightVideoContainer.appendChild(this.eventCanvas);
                            observer.disconnect();
                        }
                    } else {
                        if (leftVideoContainer && this.eventCanvas) {
                            leftVideoContainer.appendChild(this.eventCanvas);
                            observer.disconnect();
                        }
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                });

                // 모든 참가자에게 업데이트된 사용자 리스트 전송
                this.state.session.signal({
                    data: JSON.stringify({ leftUserList, rightUserList }),
                    type: 'userList',
                });

                resolve({ leftUserList, rightUserList });
                return {
                    leftUserList,
                    rightUserList,
                };
            }, () => {
                // 상태 업데이트 후 마이크 상태 업데이트
                this.updateAudioStatus();
            });
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
            newPhase = currentPhase === 1 ? 1 : 1; // Phase를 1과 2 사이에서 변경
        }

        // 새로운 phase와 turn을 모든 참가자에게 브로드캐스트
        if (session) {
            session.signal({
                type: 'phaseChange',
                data: JSON.stringify({ currentPhase: newPhase, currentTurn: newTurn }),
            });
            //console.log(`Broadcasted phaseChange signal: Phase ${newPhase}, Turn ${newTurn}`);
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
            //console.log('Disconnected from session');
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
        //console.log('Unpublished existing publisher for screen sharing');

        const OV = new OpenVidu();
        let screenPublisher = null;

        try {
            screenPublisher = await OV.initPublisherAsync(undefined, {
                videoSource: "screen",
                audioSource: undefined,
                publishAudio: false,
                publishVideo: true,
            });
            //console.log('Initialized screen publisher');
        } catch (error) {
            console.error('Error initializing screen publisher:', error);
            // 기존 퍼블리셔 복원
            session.publish(publisher);
            //console.log('Restored original publisher after screen share initialization failure');
            return;
        }

        try {
            session.publish(screenPublisher);
            this.setState({
                publisher: screenPublisher,
                mainStreamManager: screenPublisher,
                isSharingScreen: true,
            });
            //console.log('Published screen share stream');
        } catch (error) {
            console.error('Error publishing screen share:', error);
            // 기존 퍼블리셔 복원
            session.publish(publisher);
            //console.log('Restored original publisher after screen share publishing failure');
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
        //console.log('Unpublished screen share publisher');

        // 화면 공유 퍼블리셔의 트랙 중지
        publisher.stream.getMediaStream().getTracks().forEach((track) => track.stop());
        //console.log('Stopped all tracks of screen share publisher');

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
            //console.log('Published camera stream after stopping screen share');

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
            //console.log(`User ${this.state.userName} audio set to ${shouldEnableAudio}`);
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
            //console.log('Created session:', response.data);
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
            //console.log('Created token:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating token:', error);
            throw error;
        }
    }

    // Left 사용자 편집 모드 토글
    toggleLeftUserEdit() {
        this.setState(
            { isLeftUserEditing: !this.state.isLeftUserEditing },
            () => {
                // 편집 모드 종료 시 다른 클라이언트에 주장 전송
                if (!this.state.isLeftUserEditing) {
                    this.sendArgumentSignal('leftUserArgument', this.state.leftUserArgument);
                }
            }
        );
    }

    // Right 사용자 편집 ��드 토글
    toggleRightUserEdit() {
        this.setState(
            { isRightUserEditing: !this.state.isRightUserEditing },
            () => {
                // 편집 모드 종료 시 다른 클라이언트에 주장 전송
                if (!this.state.isRightUserEditing) {
                    this.sendArgumentSignal('rightUserArgument', this.state.rightUserArgument);
                }
            }
        );
    }

    // 주장 입력 변경 처리
    handleArgumentChange(event, userSide) {
        this.setState({ [userSide]: event.target.value });
    }

    // 주장 변경 시그널 전송
    sendArgumentSignal(argumentKey, argumentValue) {
        const { session } = this.state;
        if (session) {
            session.signal({
                data: JSON.stringify({ argumentKey, argumentValue }),
                type: 'argumentUpdate',
            });
        }
    }




    render() {
        const { mainStreamManager, subscribers, isSharingScreen, leftUserList, rightUserList, currentPhase, currentTurn, session } = this.state;

        // 현재 세션의 모든 사용자 (본인 포함)
        const allStreamManagers = [];
        // 본인의 connectionId
        const localConnectionId = session?.connection?.connectionId;
        const { leftUserArgument, rightUserArgument, isLeftUserEditing, isRightUserEditing, } = this.state;
        // 본인의 스트림 매니저 추가
        if (mainStreamManager && localConnectionId) {
            allStreamManagers.push({
                connectionId: localConnectionId,
                streamManager: mainStreamManager,
                userName: this.state.userName,
            });
            //console.log(`Added mainStreamManager: ${localConnectionId}`);
        }

        // 구독자 스트림 추가
        subscribers.forEach((sub) => {
            allStreamManagers.push({
                connectionId: sub.connectionId,
                streamManager: sub.subscriber,
                userName: sub.userName,
            });
            //console.log(`Added subscriber: ${sub.userName}, Connection ID: ${sub.connectionId}`);
        });

        // 좌측 및 우측 사용자 스트림 매니저 매핑
        const leftStreamManagers = leftUserList.map((user) => {
            const manager = allStreamManagers.find((manager) => manager.connectionId === user.connectionId);
            if (!manager) {
                //console.warn(`No streamManager found for Connection ID: ${user.connectionId}`);
            }
            return manager;
        }).filter(Boolean);

        const rightStreamManagers = rightUserList.map((user) => {
            const manager = allStreamManagers.find((manager) => manager.connectionId === user.connectionId);
            if (!manager) {
                //console.warn(`No streamManager found for Connection ID: ${user.connectionId}`);
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
                        {/* Left User Video */}
                        <div className='left-video '>
                            {currentLeftUser ? (
                                <div className="user-video">
                                    <UserVideoComponent
                                        streamManager={currentLeftUser.streamManager}
                                        localConnectionId={localConnectionId}
                                    />
                                    {/* LeftUser의 주장 표시/입력 공간 */}
                                    <div className="argument-section-bottom">
                                        <div
                                            className={`speech-bubble ${this.props.isstart ? 'disabled' :
                                                    isLeftUserEditing ? 'editing' :
                                                        localConnectionId === currentLeftUser?.connectionId ? '' : 'disabled'
                                                }`}
                                            onClick={() => {
                                                if (!isLeftUserEditing && localConnectionId === currentLeftUser?.connectionId) {
                                                    this.toggleLeftUserEdit();
                                                }
                                            }}
                                        >
                                            {isLeftUserEditing ? (
                                                <input
                                                    type="text"
                                                    placeholder="주장을 입력하세요"
                                                    value={leftUserArgument}
                                                    maxLength={15} // 글자 제한
                                                    onChange={(e) => this.handleArgumentChange(e, 'leftUserArgument')}
                                                    onClick={(e) => e.stopPropagation()} // input 클릭 시 부모의 클릭 이벤트 방지
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            this.toggleLeftUserEdit(); // Enter 키 입력 시 편집 모드 종료
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <p>{leftUserArgument || '주장입력'}</p>
                                            )}
                                        </div>
                                    </div>






                                </div>
                            ) : (
                                <img className="empty-slot" src="/unknown.png" />
                            )}
                        </div>

                        {/* Right User Video */}
                        <div className='right-video'>
                            {currentRightUser ? (
                                <div className="user-video">
                                    <UserVideoComponent
                                        streamManager={currentRightUser.streamManager}
                                        localConnectionId={localConnectionId}
                                    />
                                    {/* RightUser의 주장 표시/입력 공간 */}
                                    <div className="argument-section-bottom">
                                        <div
                                            className={`speech-bubble ${this.props.isstart ? 'disabled' :
                                                isRightUserEditing ? 'editing' :
                                                    localConnectionId === currentRightUser?.connectionId ? '' : 'disabled'
                                                }`}
                                            onClick={() => {
                                                if (!isRightUserEditing && localConnectionId === currentRightUser?.connectionId) {
                                                    this.toggleRightUserEdit();
                                                }
                                            }}
                                        >
                                            {isRightUserEditing ? (
                                                <input
                                                    type="text"
                                                    placeholder="주장을 입력하세요"
                                                    value={rightUserArgument}
                                                    maxLength={15} // 글자 제한
                                                    onChange={(e) => this.handleArgumentChange(e, 'rightUserArgument')}
                                                    onClick={(e) => e.stopPropagation()} // input 클릭 시 부모의 클릭 이벤트 방지
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            this.toggleRightUserEdit(); // Enter 키 입력 시 편집 모드 종료
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <p>{rightUserArgument || '주장입력'}</p>
                                            )}
                                        </div>
                                    </div>



                                </div>

                            ) : (
                                <img className="empty-slot" src="/unknown.png" />
                            )}
                        </div>
                    </div>
                </div>
            </div >
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
