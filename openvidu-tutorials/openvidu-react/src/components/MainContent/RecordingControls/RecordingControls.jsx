import React, { useState, useRef, useEffect } from 'react';
import './RecordingControls.css';

const RecordingControls = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const listRef = useRef(null);
  const audioPlaybackRef = useRef(null);  // 녹음된 오디오를 플레이할 수 있도록

  const handleStart = async () => {
    // 내 음성 스트림을 가져오기
    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(localStream);

    // WebRTC를 통해 상대방의 스트림을 받아오기 위한 설정
    const peerConnection = new RTCPeerConnection();
    const remoteStream = new MediaStream();

    // 내 스트림을 peerConnection에 추가 (자기 자신의 오디오만 전송)
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // 상대방의 스트림을 받기 위한 처리
    peerConnection.ontrack = (event) => {
      if (event.track.kind === 'audio') {
        remoteStream.addTrack(event.track);
      }
    };

    // WebRTC signaling을 통해 상대방과 연결 후, 상대방의 스트림을 받아오는 코드가 추가되어야 합니다.

    // 두 음성 스트림을 합쳐서 하나의 MediaStream 만들기
    const combinedStream = new MediaStream();
    localStream.getTracks().forEach(track => combinedStream.addTrack(track));  // 내 음성 스트림 추가
    remoteStream.getTracks().forEach(track => combinedStream.addTrack(track));  // 상대방 음성 스트림 추가

    // MediaRecorder로 두 음성 스트림을 동시에 녹음
    const recorder = new MediaRecorder(combinedStream);
    setMediaRecorder(recorder);

    // 녹음된 데이터를 담을 배열
    const audioChunks = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioURL = URL.createObjectURL(audioBlob);

      // 오디오 파일을 React 컴포넌트에서 재생할 수 있도록 처리
      audioPlaybackRef.current.src = audioURL;

      // 녹음된 파일을 recordings 상태에 추가
      setRecordings((prevRecordings) => [
        ...prevRecordings,
        { url: audioURL, name: `Recording ${prevRecordings.length + 1}` },
      ]);
    };

    // 녹음 시작
    recorder.start();
    setIsRecording(true);
  };

  const handleStop = () => {
    mediaRecorder.stop();
    setIsRecording(false);
  };

  // 녹음 삭제 함수
  const handleDelete = (index) => {
    setRecordings((prevRecordings) => prevRecordings.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [recordings]);

  return (
    <div className="recording-controls">
      {/* 녹음 시작/중지 버튼 */}
      {!isRecording ? (
        <button onClick={handleStart} className="record-button start-button">
          Start !!!
        </button>
      ) : (
        <button onClick={handleStop} className="record-button stop-button">
          - STOP -
        </button>
      )}

      {/* 오디오 목록 및 재생 */}
      <ul className="recording-list" ref={listRef}>
        {recordings.map((rec, index) => (
          <li key={index}>
            <div>
              <p>{rec.name}</p>
              <audio controls src={rec.url} />
              <button onClick={() => handleDelete(index)} className="delete-button">
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* 오디오 플레이어 */}
      <audio ref={audioPlaybackRef} controls />
    </div>
  );
};

export default RecordingControls;